import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { EmbeddedVectorSearchService } from "@/lib/services/EmbeddedVectorSearchService";
import { EmbeddingService } from "@/lib/services/EmbeddingService";
import { ReasoningEngine } from "@/lib/services/ReasoningEngine";
import { SearchTool } from "@/lib/services/SearchTool";
import { QueryAnalyzer } from "@/lib/services/QueryAnalyzer";
import { ResponseSynthesizer } from "@/lib/services/ResponseSynthesizer";
import { LLMService } from "@/lib/services/LLMService";
import { PROVIDER_DEFAULTS } from "@/lib/services/providers/LLMProviderFactory";
import type { LLMProviderType } from "@/lib/types/llmProvider";
import type { ReasoningStep } from "@/lib/types/reasoning";

// ---------------------------------------------------------------------------
// 旧モデル比較リクエスト（後方互換）
// ---------------------------------------------------------------------------

interface ModelTestRequest {
  message: string;
  models: string[];
}

interface ModelTestResult {
  model: string;
  status: "success" | "error";
  response: string;
  duration: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// 新プロバイダーテストリクエスト
// ---------------------------------------------------------------------------

interface ProviderTestRequest {
  message: string;
  provider: "huggingface" | "groq" | "openrouter";
}

interface ProviderTestResult {
  provider: string;
  model: string;
  status: "success" | "error";
  answer: string;
  reasoningSteps: ReasoningStep[];
  totalSearches: number;
  confidence: number;
  duration: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// サービスインスタンス（キャッシュ）
// ---------------------------------------------------------------------------

let vectorSearchService: EmbeddedVectorSearchService | null = null;
let embeddingService: EmbeddingService | null = null;

async function getServices() {
  if (!vectorSearchService) {
    vectorSearchService = new EmbeddedVectorSearchService();
    await vectorSearchService.initialize();
  }
  if (!embeddingService) {
    embeddingService = new EmbeddingService();
  }
  return { vectorSearchService, embeddingService };
}

// ---------------------------------------------------------------------------
// プロバイダー別 API キー解決
// ---------------------------------------------------------------------------

const PROVIDER_API_KEY_ENV: Record<LLMProviderType, string[]> = {
  huggingface: ["HUGGINGFACE_API_KEY", "LLM_API_KEY"],
  groq: ["GROQ_API_KEY", "LLM_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY", "LLM_API_KEY"],
};

function resolveApiKey(provider: LLMProviderType): string | undefined {
  const envKeys = PROVIDER_API_KEY_ENV[provider];
  for (const key of envKeys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// プロバイダー指定で LLMService を生成
// ---------------------------------------------------------------------------

/**
 * 指定されたプロバイダー用の LLMService を生成する。
 *
 * LLMService のコンストラクタは引数なしで呼ぶと LLMProviderFactory.createFromEnv() を
 * 使用するため、一時的に環境変数を設定してからインスタンスを生成し、元に戻す。
 */
function createLLMServiceForProvider(providerType: LLMProviderType): {
  llmService: LLMService;
  model: string;
} {
  const apiKey = resolveApiKey(providerType);
  if (!apiKey) {
    const envNames = PROVIDER_API_KEY_ENV[providerType].join(" or ");
    throw new Error(
      `APIキーが設定されていません。${envNames} を設定してください。`
    );
  }

  const model = PROVIDER_DEFAULTS[providerType].model;

  // 環境変数を一時的に設定して LLMService を生成
  const savedProvider = process.env.LLM_PROVIDER;
  const savedApiKey = process.env.LLM_API_KEY;
  const savedModel = process.env.LLM_MODEL;

  try {
    process.env.LLM_PROVIDER = providerType;
    process.env.LLM_API_KEY = apiKey;
    process.env.LLM_MODEL = model;

    const llmService = new LLMService();
    return { llmService, model };
  } finally {
    // 環境変数を元に戻す
    if (savedProvider !== undefined) {
      process.env.LLM_PROVIDER = savedProvider;
    } else {
      delete process.env.LLM_PROVIDER;
    }
    if (savedApiKey !== undefined) {
      process.env.LLM_API_KEY = savedApiKey;
    } else {
      delete process.env.LLM_API_KEY;
    }
    if (savedModel !== undefined) {
      process.env.LLM_MODEL = savedModel;
    } else {
      delete process.env.LLM_MODEL;
    }
  }
}

// ---------------------------------------------------------------------------
// プロバイダー指定で ReasoningEngine を構築・実行
// ---------------------------------------------------------------------------

async function testProvider(
  providerType: LLMProviderType,
  message: string
): Promise<ProviderTestResult> {
  const start = Date.now();

  try {
    const { llmService, model } = createLLMServiceForProvider(providerType);

    // 共有サービスを取得
    const { vectorSearchService: vs, embeddingService: es } =
      await getServices();

    const searchTool = new SearchTool(es, vs);
    const queryAnalyzer = new QueryAnalyzer(llmService);
    const responseSynthesizer = new ResponseSynthesizer(llmService);

    const reasoningEngine = new ReasoningEngine({
      llmService,
      searchTool,
      queryAnalyzer,
      responseSynthesizer,
    });

    const result = await reasoningEngine.reason(message, {
      maxIterations: 3,
      timeout: 45000,
    });

    return {
      provider: providerType,
      model,
      status: "success",
      answer: result.answer,
      reasoningSteps: result.reasoningSteps,
      totalSearches: result.totalSearches,
      confidence: result.confidence,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      provider: providerType,
      model: PROVIDER_DEFAULTS[providerType]?.model ?? "unknown",
      status: "error",
      answer: "",
      reasoningSteps: [],
      totalSearches: 0,
      confidence: 0,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// 旧モデル比較テスト（後方互換）
// ---------------------------------------------------------------------------

async function testModel(
  client: HfInference,
  model: string,
  query: string,
  context: string
): Promise<ModelTestResult> {
  const start = Date.now();
  try {
    const response = await Promise.race([
      client.chatCompletion({
        model,
        messages: [
          {
            role: "system",
            content:
              "あなたはワンダーランド東京の親切なFAQアシスタントです。提供されたコンテキスト情報のみを使用して、ユーザーの質問に日本語で正確に回答してください。コンテキストに含まれない情報については「申し訳ございませんが、その情報は持ち合わせておりません」と回答してください。",
          },
          {
            role: "user",
            content: `以下のコンテキスト情報を参考にして質問に答えてください。\n\nコンテキスト:\n${context}\n\n質問: ${query}`,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("タイムアウト（30秒）")), 30000)
      ),
    ]);

    const text = response.choices[0]?.message?.content || "(空の応答)";
    return {
      model,
      status: "success",
      response: text.trim(),
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      model,
      status: "error",
      response: "",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// サポートされるプロバイダー
// ---------------------------------------------------------------------------

const SUPPORTED_PROVIDERS: LLMProviderType[] = [
  "huggingface",
  "groq",
  "openrouter",
];

// ---------------------------------------------------------------------------
// POST ハンドラー
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- 新しいプロバイダーテストモード ---
    if (body.provider) {
      const { message, provider } = body as ProviderTestRequest;

      if (!message || message.trim().length === 0) {
        return NextResponse.json(
          { error: "message が必要です" },
          { status: 400 }
        );
      }

      if (!SUPPORTED_PROVIDERS.includes(provider as LLMProviderType)) {
        return NextResponse.json(
          {
            error: `無効なプロバイダーです: '${provider}'。サポート: ${SUPPORTED_PROVIDERS.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const result = await testProvider(
        provider as LLMProviderType,
        message.trim()
      );

      return NextResponse.json({
        query: message,
        result,
      });
    }

    // --- 旧モデル比較モード（後方互換）---
    const { message, models } = body as ModelTestRequest;

    if (!message || !models || models.length === 0) {
      return NextResponse.json(
        { error: "message と models が必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HUGGINGFACE_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    // ベクトル検索でコンテキストを取得
    const { vectorSearchService: vs, embeddingService: es } =
      await getServices();
    const queryEmbedding = await es.embedQuery(message);
    const searchResults = await vs.search(queryEmbedding);
    const context = searchResults.map((r) => r.document).join("\n\n");

    const contextInfo = {
      resultsCount: searchResults.length,
      topScores: searchResults.slice(0, 3).map((r) => r.score.toFixed(3)),
    };

    // 全モデルを並列でテスト
    const client = new HfInference(apiKey);
    const results = await Promise.all(
      models.map((model) => testModel(client, model, message, context))
    );

    return NextResponse.json({
      query: message,
      context: contextInfo,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `サーバーエラー: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
