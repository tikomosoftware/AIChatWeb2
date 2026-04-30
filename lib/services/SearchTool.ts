import type { SearchOptions, SearchToolResult } from '@/lib/types/reasoning';
import { EmbeddingService } from '@/lib/services/EmbeddingService';
import { EmbeddedVectorSearchService } from '@/lib/services/EmbeddedVectorSearchService';

/**
 * SearchTool - 検索ツール
 *
 * EmbeddingService と EmbeddedVectorSearchService を統合し、
 * クエリのベクトル化と類似度検索を一括実行するコンポーネント。
 *
 * ReAct推論エンジンから簡潔に検索を実行するためのインターフェースを提供する。
 */
export class SearchTool {
  private embeddingService: EmbeddingService;
  private vectorSearchService: EmbeddedVectorSearchService;

  /** デフォルトの検索閾値 */
  private static readonly DEFAULT_THRESHOLD = 0.5;
  /** デフォルトの返却件数 */
  private static readonly DEFAULT_TOP_K = 3;

  constructor(
    embeddingService: EmbeddingService,
    vectorSearchService: EmbeddedVectorSearchService
  ) {
    this.embeddingService = embeddingService;
    this.vectorSearchService = vectorSearchService;
  }

  /**
   * クエリをベクトル化し、類似度検索を実行して結果を返却する
   *
   * @param query - 検索クエリ文字列
   * @param options - 検索オプション（topK, threshold）
   * @returns 検索結果（ドキュメント、スコア、関連性の有無、最高スコア）
   */
  async search(query: string, options?: SearchOptions): Promise<SearchToolResult> {
    const topK = options?.topK ?? SearchTool.DEFAULT_TOP_K;

    // VectorSearchService が未初期化の場合は初期化する
    if (!this.vectorSearchService.isInitialized()) {
      await this.vectorSearchService.initialize();
    }

    // クエリをベクトル化
    const embedding = await this.embeddingService.embedQuery(query);

    // 類似度検索を実行
    // EmbeddedVectorSearchService.search() は内部で scoreThreshold によるフィルタリングを行う
    const results = await this.vectorSearchService.search(embedding, topK);

    // 結果をマッピング
    const documents = results.map((r) => r.document);
    const scores = results.map((r) => r.score);

    // VectorSearchService が閾値でフィルタリング済みなので、
    // 結果が存在すれば関連性ありと判定する
    const hasRelevantResults = results.length > 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      documents,
      scores,
      hasRelevantResults,
      bestScore,
    };
  }
}
