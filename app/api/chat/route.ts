import { NextRequest, NextResponse } from "next/server";
import { EmbeddedVectorSearchService } from "@/lib/services/EmbeddedVectorSearchService";
import { EmbeddingService } from "@/lib/services/EmbeddingService";
import { LLMService } from "@/lib/services/LLMService";
import { ErrorCode, ERROR_MESSAGES } from "@/lib/types/errors";

// Request interface
interface ChatRequest {
  message: string;
}

// Response interface
interface ChatResponse {
  response: string;
  sources?: string[];
  error?: string;
  errorCode?: ErrorCode;
}

// Service instances (singleton pattern for reuse)
let vectorSearchService: EmbeddedVectorSearchService | null = null;
let embeddingService: EmbeddingService | null = null;
let llmService: LLMService | null = null;

/**
 * Initialize services if not already initialized
 */
async function initializeServices(): Promise<void> {
  if (!vectorSearchService) {
    vectorSearchService = new EmbeddedVectorSearchService();
    await vectorSearchService.initialize();
  }

  if (!embeddingService) {
    embeddingService = new EmbeddingService();
  }

  if (!llmService) {
    llmService = new LLMService();
  }
}

/**
 * Validate request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "リクエストボディが必要です。" };
  }

  if (!body.message || typeof body.message !== "string") {
    return { valid: false, error: "メッセージは必須です。" };
  }

  if (body.message.trim().length === 0) {
    return { valid: false, error: "メッセージを入力してください。" };
  }

  if (body.message.length > 1000) {
    return { valid: false, error: "メッセージは1000文字以内で入力してください。" };
  }

  return { valid: true };
}

/**
 * Create error response
 */
function createErrorResponse(
  code: ErrorCode,
  customMessage?: string
): NextResponse<ChatResponse> {
  const message = customMessage || ERROR_MESSAGES[code];
  return NextResponse.json(
    {
      response: "",
      error: message,
      errorCode: code,
    },
    { status: code === ErrorCode.VALIDATION_ERROR ? 400 : 500 }
  );
}

/**
 * POST handler for chat endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse(ErrorCode.VALIDATION_ERROR, "無効なリクエスト形式です。");
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return createErrorResponse(ErrorCode.VALIDATION_ERROR, validation.error);
    }

    const userMessage = body.message.trim();

    // Initialize services
    try {
      await initializeServices();
    } catch (error) {
      console.error("Service initialization failed:", error);
      return createErrorResponse(ErrorCode.VECTOR_DB_ERROR);
    }

    // Step 1: Vectorize the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddingService!.embedQuery(userMessage);
    } catch (error) {
      console.error("Embedding generation failed:", error);
      return createErrorResponse(ErrorCode.EMBEDDING_ERROR);
    }

    // Step 2: Search for relevant documents in vector database
    let searchResults;
    try {
      searchResults = await vectorSearchService!.search(queryEmbedding);
    } catch (error) {
      console.error("Vector search failed:", error);
      return createErrorResponse(ErrorCode.VECTOR_DB_ERROR);
    }

    // Step 3: Check similarity scores and filter results
    if (searchResults.length === 0) {
      // No relevant data found - return as a special informational response
      return NextResponse.json({
        response: ERROR_MESSAGES[ErrorCode.NO_RELEVANT_DATA],
        sources: [],
        errorCode: ErrorCode.NO_RELEVANT_DATA,
      });
    }

    // Extract documents and sources
    const contextDocuments = searchResults.map((result) => result.document);
    const sources = searchResults.map((result, index) => 
      `[${index + 1}] Score: ${result.score.toFixed(2)}`
    );

    // Step 4: Generate response using LLM with context
    let generatedResponse: string;
    try {
      const timeout = parseInt(process.env.REQUEST_TIMEOUT || "30000");
      generatedResponse = await llmService!.generateResponse(
        userMessage,
        contextDocuments,
        { timeout }
      );
    } catch (error) {
      console.error("LLM generation failed:", error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message === "RATE_LIMIT_ERROR") {
          return createErrorResponse(ErrorCode.RATE_LIMIT_ERROR);
        }
        if (error.message === "TIMEOUT_ERROR") {
          return createErrorResponse(ErrorCode.TIMEOUT_ERROR);
        }
      }
      
      return createErrorResponse(ErrorCode.LLM_ERROR);
    }

    // Return successful response
    return NextResponse.json({
      response: generatedResponse,
      sources: sources,
    });

  } catch (error) {
    console.error("Unexpected error in chat API:", error);
    return createErrorResponse(
      ErrorCode.LLM_ERROR,
      "予期しないエラーが発生しました。"
    );
  }
}
