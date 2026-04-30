/**
 * HuggingFaceProvider
 *
 * Hugging Face Inference API を使用した LLMProvider 実装。
 * @huggingface/inference SDK を使用して chatCompletion リクエストを実行する。
 *
 * 要件: 7.1, 7.2, 7.3, 7.4
 */

import { HfInference } from "@huggingface/inference";
import type {
  LLMProvider,
  ChatCompletionParams,
  ChatCompletionResult,
} from "@/lib/types/llmProvider";

/** デフォルトモデル名 */
const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct";

export class HuggingFaceProvider implements LLMProvider {
  private client: HfInference;
  private model: string;

  /**
   * @param apiKey  Hugging Face API キー
   * @param model   使用するモデル名（省略時は Qwen/Qwen2.5-7B-Instruct）
   */
  constructor(apiKey: string, model?: string) {
    this.client = new HfInference(apiKey);
    this.model = model || DEFAULT_MODEL;
  }

  /**
   * chatCompletion リクエストを実行する。
   *
   * メッセージ配列、maxTokens、temperature を Hugging Face API に渡し、
   * レスポンスを ChatCompletionResult にマッピングして返却する。
   * レート制限エラー（429）を検出した場合は識別可能なエラーをスローする。
   */
  async chatCompletion(
    params: ChatCompletionParams
  ): Promise<ChatCompletionResult> {
    try {
      const response = await this.client.chatCompletion({
        model: this.model,
        messages: params.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: params.maxTokens ?? 512,
        temperature: params.temperature ?? 0.7,
      });

      const content = response.choices[0]?.message?.content || "";

      const result: ChatCompletionResult = { content };

      // トークン使用量が返却されている場合はマッピングする
      if (response.usage) {
        result.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      return result;
    } catch (error: unknown) {
      // レート制限エラーの検出（要件 7.3）
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("429")) {
          throw new Error("RATE_LIMIT_ERROR");
        }
      }
      throw error;
    }
  }

  /** プロバイダー名を返却する（要件 7.4） */
  getProviderName(): string {
    return "huggingface";
  }

  /** 使用中のモデル名を返却する */
  getModelName(): string {
    return this.model;
  }
}
