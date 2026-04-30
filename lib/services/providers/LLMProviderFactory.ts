/**
 * LLMProviderFactory
 *
 * 環境変数に基づいて適切なLLMプロバイダーインスタンスを生成するファクトリー。
 * LLM_PROVIDER 環境変数でプロバイダーを選択し、未設定時は
 * HUGGINGFACE_API_KEY にフォールバックして後方互換性を維持する。
 *
 * 要件: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import type { LLMProvider, LLMProviderType } from "@/lib/types/llmProvider";
import { HuggingFaceProvider } from "./HuggingFaceProvider";
import { OpenAICompatibleProvider } from "./OpenAICompatibleProvider";

/**
 * プロバイダー別デフォルト設定（baseURL・モデル名）
 */
export const PROVIDER_DEFAULTS: Record<
  LLMProviderType,
  { baseURL?: string; model: string }
> = {
  huggingface: {
    model: "Qwen/Qwen2.5-7B-Instruct",
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    model: "deepseek-r1-distill-qwen-32b",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    model: "deepseek/deepseek-r1:free",
  },
};

/** サポートされるプロバイダー名の一覧 */
const SUPPORTED_PROVIDERS: LLMProviderType[] = [
  "huggingface",
  "groq",
  "openrouter",
];

export class LLMProviderFactory {
  /**
   * 環境変数からLLMプロバイダーインスタンスを生成する。
   *
   * 優先順位:
   * 1. LLM_PROVIDER + LLM_API_KEY（新しい統一形式）
   * 2. HUGGINGFACE_API_KEY（後方互換フォールバック）
   *
   * @returns LLMProvider インスタンス
   * @throws LLM_PROVIDER 設定時に LLM_API_KEY が未設定の場合
   * @throws LLM_PROVIDER に無効な値が設定されている場合
   * @throws いずれの API キーも設定されていない場合
   */
  createFromEnv(): LLMProvider {
    const providerType = process.env.LLM_PROVIDER as
      | LLMProviderType
      | undefined;

    // --- 新しい統一環境変数が設定されている場合 ---
    if (providerType) {
      // プロバイダー名のバリデーション（要件 10.6）
      if (!SUPPORTED_PROVIDERS.includes(providerType)) {
        throw new Error(
          `Unsupported LLM_PROVIDER: '${providerType}'. Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`
        );
      }

      // API キーの必須チェック（要件 6.5）
      const apiKey = process.env.LLM_API_KEY;
      if (!apiKey) {
        throw new Error(
          "LLM_API_KEY is required when LLM_PROVIDER is set"
        );
      }

      // モデル名の解決（要件 6.6）
      const model =
        process.env.LLM_MODEL || PROVIDER_DEFAULTS[providerType].model;

      // HuggingFace の場合は専用プロバイダーを使用（要件 6.1）
      if (providerType === "huggingface") {
        return new HuggingFaceProvider(apiKey, model);
      }

      // Groq / OpenRouter は OpenAI互換プロバイダーを使用（要件 6.2, 6.3）
      return new OpenAICompatibleProvider({
        apiKey,
        baseURL: PROVIDER_DEFAULTS[providerType].baseURL!,
        model,
        providerName: providerType,
        defaultHeaders:
          providerType === "openrouter"
            ? {
                "HTTP-Referer":
                  process.env.APP_URL || "http://localhost:3000",
              }
            : undefined,
      });
    }

    // --- 後方互換フォールバック: HUGGINGFACE_API_KEY（要件 6.4）---
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      throw new Error(
        "LLM_API_KEY or HUGGINGFACE_API_KEY is required"
      );
    }

    const hfModel =
      process.env.HUGGINGFACE_MODEL ||
      PROVIDER_DEFAULTS.huggingface.model;
    return new HuggingFaceProvider(hfApiKey, hfModel);
  }
}
