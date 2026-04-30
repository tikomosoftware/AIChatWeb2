/**
 * OpenAICompatibleProvider
 *
 * OpenAI互換APIを使用したLLMプロバイダー実装（Groq、OpenRouter共通）。
 * `openai` パッケージを使用し、baseURL を切り替えることで
 * 複数のプロバイダーに対応する。
 *
 * 要件: 8.1, 8.2, 8.3, 8.4
 */

import OpenAI from "openai";
import type {
  LLMProvider,
  ChatCompletionParams,
  ChatCompletionResult,
} from "@/lib/types/llmProvider";

/** コンストラクタに渡す設定 */
interface OpenAICompatibleProviderConfig {
  /** APIキー */
  apiKey: string;
  /** APIのベースURL（例: https://api.groq.com/openai/v1） */
  baseURL: string;
  /** 使用するモデル名 */
  model: string;
  /** プロバイダー名（'groq' | 'openrouter'） */
  providerName: string;
  /** リクエストに付与するデフォルトヘッダー */
  defaultHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private providerName: string;

  constructor(config: OpenAICompatibleProviderConfig) {
    this.model = config.model;
    this.providerName = config.providerName;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders,
    });
  }

  /**
   * chatCompletion リクエストを実行する。
   *
   * メッセージ配列、maxTokens、temperature を OpenAI互換 API に渡し、
   * レスポンスを ChatCompletionResult にマッピングして返却する。
   * レート制限エラー（429）を検出した場合は識別可能なエラーをスローする。
   */
  async chatCompletion(
    params: ChatCompletionParams
  ): Promise<ChatCompletionResult> {
    try {
      const response = await this.client.chat.completions.create({
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
      // レート制限エラーの検出
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("429")) {
          throw new Error("RATE_LIMIT_ERROR");
        }
      }
      throw error;
    }
  }

  /** プロバイダー名を返却する（要件 8.4） */
  getProviderName(): string {
    return this.providerName;
  }

  /** 使用中のモデル名を返却する */
  getModelName(): string {
    return this.model;
  }
}
