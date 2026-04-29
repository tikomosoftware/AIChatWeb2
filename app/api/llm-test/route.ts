import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { EmbeddedVectorSearchService } from "@/lib/services/EmbeddedVectorSearchService";
import { EmbeddingService } from "@/lib/services/EmbeddingService";

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

// サービスインスタンス（キャッシュ）
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

/**
 * 1つのモデルでテスト実行
 */
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

export async function POST(request: NextRequest) {
  try {
    const body: ModelTestRequest = await request.json();

    if (!body.message || !body.models || body.models.length === 0) {
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
    const { vectorSearchService, embeddingService } = await getServices();
    const queryEmbedding = await embeddingService.embedQuery(body.message);
    const searchResults = await vectorSearchService.search(queryEmbedding);
    const context = searchResults.map((r) => r.document).join("\n\n");

    const contextInfo = {
      resultsCount: searchResults.length,
      topScores: searchResults.slice(0, 3).map((r) => r.score.toFixed(3)),
    };

    // 全モデルを並列でテスト
    const client = new HfInference(apiKey);
    const results = await Promise.all(
      body.models.map((model) => testModel(client, model, body.message, context))
    );

    return NextResponse.json({
      query: body.message,
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
