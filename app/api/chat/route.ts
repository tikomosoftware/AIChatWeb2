import { NextRequest, NextResponse } from "next/server";
import { EmbeddedVectorSearchService } from "@/lib/services/EmbeddedVectorSearchService";
import { EmbeddingService } from "@/lib/services/EmbeddingService";
import { LLMService } from "@/lib/services/LLMService";
import { ChatHistoryService } from "@/lib/services/ChatHistoryService";
import { SearchTool } from "@/lib/services/SearchTool";
import { QueryAnalyzer } from "@/lib/services/QueryAnalyzer";
import { ResponseSynthesizer } from "@/lib/services/ResponseSynthesizer";
import { ReasoningEngine } from "@/lib/services/ReasoningEngine";
import { ErrorCode, ERROR_MESSAGES } from "@/lib/types/errors";
import type { ReasoningStep } from "@/lib/types/reasoning";

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
  reasoning?: ReasoningStep[]; // Only included when DEBUG_MODE is enabled
}

// Service instances (singleton pattern for reuse)
let vectorSearchService: EmbeddedVectorSearchService | null = null;
let embeddingService: EmbeddingService | null = null;
let llmService: LLMService | null = null;
let searchTool: SearchTool | null = null;
let queryAnalyzer: QueryAnalyzer | null = null;
let responseSynthesizer: ResponseSynthesizer | null = null;
let reasoningEngine: ReasoningEngine | null = null;

/**
 * Check if debug mode is enabled via DEBUG_MODE env var
 */
function isDebugMode(): boolean {
  const debugMode = process.env.DEBUG_MODE;
  return debugMode === "true" || debugMode === "1";
}

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
    console.log(`Using embedding model: ${embeddingService.getModelName()}`);
  }

  if (!llmService) {
    llmService = new LLMService();
  }

  if (!searchTool) {
    searchTool = new SearchTool(embeddingService, vectorSearchService);
  }

  if (!queryAnalyzer) {
    queryAnalyzer = new QueryAnalyzer(llmService);
  }

  if (!responseSynthesizer) {
    responseSynthesizer = new ResponseSynthesizer(llmService);
  }

  if (!reasoningEngine) {
    reasoningEngine = new ReasoningEngine({
      llmService,
      searchTool,
      queryAnalyzer,
      responseSynthesizer,
    });
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
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      return createErrorResponse(
        ErrorCode.VECTOR_DB_ERROR,
        `サービスの初期化に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    }

    // Execute reasoning via ReasoningEngine
    let result;
    try {
      result = await reasoningEngine!.reason(userMessage, {
        maxIterations: 3,
        timeout: parseInt(process.env.REQUEST_TIMEOUT || "30000"),
      });
    } catch (error) {
      console.error("ReasoningEngine error:", error);

      if (error instanceof Error) {
        if (error.message.includes("RATE_LIMIT_ERROR")) {
          return createErrorResponse(ErrorCode.RATE_LIMIT_ERROR);
        }
        if (error.message.includes("TIMEOUT_ERROR")) {
          return createErrorResponse(ErrorCode.TIMEOUT_ERROR);
        }
      }

      return createErrorResponse(ErrorCode.LLM_ERROR);
    }

    // Map ReasoningResult to ChatResponse
    const resultWithError = result as typeof result & { errorCode?: string };

    // Handle error codes from ReasoningEngine
    if (resultWithError.errorCode) {
      if (resultWithError.errorCode === ErrorCode.RATE_LIMIT_ERROR) {
        return createErrorResponse(ErrorCode.RATE_LIMIT_ERROR);
      }

      if (resultWithError.errorCode === ErrorCode.NO_RELEVANT_DATA) {
        // Return as informational response (not 500)
        const chatResponse: ChatResponse = {
          response: result.answer,
          sources: result.sources,
          errorCode: ErrorCode.NO_RELEVANT_DATA,
        };
        if (isDebugMode()) {
          chatResponse.reasoning = result.reasoningSteps;
        }
        return NextResponse.json(chatResponse);
      }

      // Other error codes → LLM_ERROR
      return createErrorResponse(ErrorCode.LLM_ERROR);
    }

    // Save chat history (non-blocking, errors logged only)
    try {
      const historyService = new ChatHistoryService();
      historyService.saveChat(userMessage, result.answer).catch((error) => {
        console.error("Failed to save chat history:", error);
      });
    } catch (error) {
      console.error("Failed to initialize chat history service:", error);
    }

    // Build successful response
    const chatResponse: ChatResponse = {
      response: result.answer,
      sources: result.sources,
    };

    // Include reasoning steps only when DEBUG_MODE is enabled
    if (isDebugMode()) {
      chatResponse.reasoning = result.reasoningSteps;
    }

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Unexpected error in chat API:", error);
    return createErrorResponse(
      ErrorCode.LLM_ERROR,
      "予期しないエラーが発生しました。"
    );
  }
}
