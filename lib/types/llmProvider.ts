/**
 * LLMプロバイダー 型定義
 *
 * Hugging Face / Groq / OpenRouter の各LLMサービスへの
 * 共通インターフェースおよび設定の型定義。
 */

// ---------------------------------------------------------------------------
// チャットメッセージ
// ---------------------------------------------------------------------------

/**
 * LLMに送信するチャットメッセージ
 */
export interface ChatMessage {
  /** メッセージの役割 */
  role: 'system' | 'user' | 'assistant';
  /** メッセージの内容 */
  content: string;
}

// ---------------------------------------------------------------------------
// チャット補完パラメータ・結果
// ---------------------------------------------------------------------------

/**
 * chatCompletionメソッドに渡すパラメータ
 */
export interface ChatCompletionParams {
  /** メッセージ配列 */
  messages: ChatMessage[];
  /** 最大トークン数 */
  maxTokens?: number;
  /** 温度パラメータ（生成のランダム性） */
  temperature?: number;
}

/**
 * chatCompletionメソッドの戻り値
 */
export interface ChatCompletionResult {
  /** 生成されたテキスト */
  content: string;
  /** トークン使用量（プロバイダーが対応している場合） */
  usage?: {
    /** プロンプトのトークン数 */
    promptTokens: number;
    /** 生成されたトークン数 */
    completionTokens: number;
    /** 合計トークン数 */
    totalTokens: number;
  };
}

// ---------------------------------------------------------------------------
// LLMプロバイダーインターフェース
// ---------------------------------------------------------------------------

/**
 * LLMプロバイダー共通インターフェース
 *
 * Hugging Face、Groq、OpenRouter の各プロバイダーが実装する
 * プロバイダー非依存のインターフェース。
 */
export interface LLMProvider {
  /**
   * チャット補完リクエストを実行する
   * @param params - チャット補完パラメータ
   * @returns チャット補完結果
   */
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;

  /**
   * プロバイダー名を返却する
   * @returns プロバイダー名（例: 'huggingface', 'groq', 'openrouter'）
   */
  getProviderName(): string;

  /**
   * 使用中のモデル名を返却する
   * @returns モデル名（例: 'Qwen/Qwen2.5-7B-Instruct'）
   */
  getModelName(): string;
}

// ---------------------------------------------------------------------------
// プロバイダー設定
// ---------------------------------------------------------------------------

/**
 * サポートされるLLMプロバイダーの種類
 */
export type LLMProviderType = 'huggingface' | 'groq' | 'openrouter';

/**
 * LLMプロバイダーの設定
 */
export interface LLMProviderConfig {
  /** プロバイダーの種類 */
  provider: LLMProviderType;
  /** 使用するモデル名 */
  model: string;
  /** APIキー */
  apiKey: string;
  /** APIのベースURL（Groq / OpenRouter 用） */
  baseURL?: string;
  /** リクエストタイムアウト（ms） */
  timeout?: number;
}
