import type { LLMProvider } from "@/lib/types/llmProvider";
import { HuggingFaceProvider } from "@/lib/services/providers/HuggingFaceProvider";
import { LLMProviderFactory } from "@/lib/services/providers/LLMProviderFactory";

export interface GenerateResponseOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/** システムプロンプト */
const SYSTEM_PROMPT =
  "あなたはワンダーランド東京の親切なFAQアシスタントです。提供されたコンテキスト情報のみを使用して、ユーザーの質問に日本語で正確に回答してください。コンテキストに含まれない情報については「申し訳ございませんが、その情報は持ち合わせておりません」と回答してください。";

/**
 * ユーザープロンプトを構築する
 */
function buildUserPrompt(query: string, context: string[]): string {
  const contextText = context.join("\n\n");
  return `以下のコンテキスト情報を参考にして質問に答えてください。\n\nコンテキスト:\n${contextText}\n\n質問: ${query}`;
}

export class LLMService {
  private provider: LLMProvider;
  private defaultTimeout: number;

  constructor(apiKey?: string, modelName?: string) {
    if (apiKey) {
      // 明示的にapiKeyが渡された場合はHuggingFaceProviderを使用（後方互換）
      this.provider = new HuggingFaceProvider(apiKey, modelName);
    } else {
      // 環境変数からプロバイダーを自動選択
      const factory = new LLMProviderFactory();
      this.provider = factory.createFromEnv();
    }
    this.defaultTimeout = parseInt(process.env.REQUEST_TIMEOUT || "30000");
  }

  async generateResponse(
    query: string,
    context: string[],
    options: GenerateResponseOptions = {}
  ): Promise<string> {
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }

    const timeout = options.timeout || this.defaultTimeout;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), timeout);
      });

      const apiPromise = this.provider.chatCompletion({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(query, context) },
        ],
        maxTokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
      });

      const result = await Promise.race([apiPromise, timeoutPromise]);

      return result.content.trim();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("429") ||
          error.message === "RATE_LIMIT_ERROR"
        ) {
          throw new Error("RATE_LIMIT_ERROR");
        }
        if (error.message.includes("timeout")) {
          throw new Error("TIMEOUT_ERROR");
        }
      }

      console.error("LLM generation failed:", error);
      throw new Error(
        `LLM generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  getModelName(): string {
    return this.provider.getModelName();
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }
}
