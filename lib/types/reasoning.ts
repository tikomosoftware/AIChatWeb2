/**
 * ReAct推論エンジン 型定義
 *
 * ReAct（Reasoning + Acting）パターンに基づく多段階推論エンジンの
 * 型・インターフェース定義。
 */

// ---------------------------------------------------------------------------
// 質問分析 (QueryAnalyzer)
// ---------------------------------------------------------------------------

/**
 * 質問の意図分類
 *
 * - factual: 事実確認（営業時間、料金など）
 * - comparison: 比較（アトラクション比較など）
 * - procedural: 手順（チケット購入方法など）
 * - exploratory: 探索的（おすすめなど）
 */
export type QueryIntent = 'factual' | 'comparison' | 'procedural' | 'exploratory';

/**
 * 質問分析の結果
 */
export interface QueryAnalysis {
  /** 質問の意図 */
  intent: QueryIntent;
  /** 分解されたサブクエリ */
  subQueries: string[];
  /** 重要キーワード */
  keywords: string[];
  /** 質問の複雑度 */
  complexity: 'simple' | 'moderate' | 'complex';
}

// ---------------------------------------------------------------------------
// ReActアクション・パース結果
// ---------------------------------------------------------------------------

/**
 * ReActアクション型
 *
 * LLMが決定するアクションの種類を表す判別共用体。
 */
export type ReActAction =
  | { type: 'SEARCH'; query: string }
  | { type: 'REFINE'; originalQuery: string; refinedQuery: string }
  | { type: 'DONE'; answer: string };

/**
 * LLMのReActフォーマット出力をパースした構造化データ
 *
 * thought / action / finalAnswer のうち少なくとも1つが非null。
 */
export interface ParsedLLMResponse {
  /** 思考内容（Thought セクション） */
  thought: string | null;
  /** アクション（Action セクション） */
  action: ReActAction | null;
  /** 最終回答（Final Answer セクション） */
  finalAnswer: string | null;
}

// ---------------------------------------------------------------------------
// 推論ステップ・結果
// ---------------------------------------------------------------------------

/**
 * 推論ループ中の各ステップを記録するデータ構造
 */
export interface ReasoningStep {
  /** ステップ番号（1始まり） */
  stepNumber: number;
  /** ステップの種類 */
  type: 'thought' | 'action' | 'observation';
  /** ステップの内容 */
  content: string;
  /** タイムスタンプ（Unix timestamp ms） */
  timestamp: number;
  /** オプションのメタデータ */
  metadata?: {
    searchQuery?: string;
    searchResults?: number;
    confidence?: number;
  };
}

/**
 * 推論エンジンの最終結果
 */
export interface ReasoningResult {
  /** 最終回答 */
  answer: string;
  /** 参照ソース */
  sources: string[];
  /** 推論過程 */
  reasoningSteps: ReasoningStep[];
  /** 実行した検索回数 */
  totalSearches: number;
  /** 回答の確信度 (0–1) */
  confidence: number;
}

/**
 * 推論エンジンのオプション
 */
export interface ReasoningOptions {
  /** 最大推論ループ回数（デフォルト: 3） */
  maxIterations?: number;
  /** タイムアウト（ms） */
  timeout?: number;
  /** 詳細ログ出力 */
  verbose?: boolean;
}

// ---------------------------------------------------------------------------
// 検索ツール (SearchTool)
// ---------------------------------------------------------------------------

/**
 * 検索オプション
 */
export interface SearchOptions {
  /** 返却する上位件数 */
  topK?: number;
  /** スコア閾値 */
  threshold?: number;
}

/**
 * 検索ツールの結果
 */
export interface SearchToolResult {
  /** 検索で取得したドキュメント */
  documents: string[];
  /** 各ドキュメントのスコア */
  scores: number[];
  /** 関連性のある結果が存在するか */
  hasRelevantResults: boolean;
  /** 最高スコア */
  bestScore: number;
}

// ---------------------------------------------------------------------------
// 回答合成 (ResponseSynthesizer)
// ---------------------------------------------------------------------------

/**
 * 合成された回答
 */
export interface SynthesizedResponse {
  /** 最終回答 */
  answer: string;
  /** 確信度 (0–1) */
  confidence: number;
  /** 参照ソース */
  sources: string[];
}
