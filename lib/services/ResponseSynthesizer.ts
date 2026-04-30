import type {
  SynthesizedResponse,
  SearchToolResult,
  ReasoningStep,
} from '@/lib/types/reasoning';
import { LLMService } from '@/lib/services/LLMService';

/**
 * ResponseSynthesizer — 回答合成
 *
 * 推論過程と検索結果を統合して最終回答を日本語で生成する。
 * LLMを使用して複数の検索結果から包括的な回答を合成し、
 * 確信度の算出とソース情報の整理を行う。
 */
export class ResponseSynthesizer {
  private llmService: LLMService;

  /** LLM合成失敗時のデフォルト回答 */
  private static readonly DEFAULT_ANSWER =
    '申し訳ございませんが、十分な情報を取得できませんでした。別の表現で質問をお試しください。';

  /** フォールバック時のベース確信度 */
  private static readonly FALLBACK_CONFIDENCE = 0.3;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * 検索結果と推論過程を統合して最終回答を生成する
   *
   * @param originalQuery - ユーザーの元の質問
   * @param searchResults - 検索ツールの結果リスト
   * @param reasoningTrace - 推論ステップの記録
   * @returns 合成された回答（answer, confidence, sources）
   */
  async synthesize(
    originalQuery: string,
    searchResults: SearchToolResult[],
    reasoningTrace: ReasoningStep[],
  ): Promise<SynthesizedResponse> {
    const allDocuments = this.collectDocuments(searchResults);
    const sources = this.extractSources(searchResults);

    // 検索結果が空の場合はデフォルト回答を返す
    if (allDocuments.length === 0) {
      return {
        answer: ResponseSynthesizer.DEFAULT_ANSWER,
        confidence: 0,
        sources: [],
      };
    }

    try {
      const synthesisPrompt = this.buildSynthesisPrompt(
        originalQuery,
        allDocuments,
        reasoningTrace,
      );

      const llmResponse = await this.llmService.generateResponse(
        synthesisPrompt,
        allDocuments,
      );

      const { answer: llmAnswer, llmConfidence } =
        this.parseLLMResponse(llmResponse);

      const confidence = this.calculateConfidence(
        searchResults,
        llmConfidence,
      );

      const answer = llmAnswer || this.buildFallbackAnswer(allDocuments);

      return {
        answer,
        confidence: this.clampConfidence(confidence),
        sources,
      };
    } catch {
      // LLM呼び出し失敗時はフォールバック回答を生成
      return this.buildFallbackResponse(allDocuments, searchResults, sources);
    }
  }

  // ---------------------------------------------------------------------------
  // プロンプト構築
  // ---------------------------------------------------------------------------

  /**
   * LLMに送信する回答合成プロンプトを構築する
   */
  private buildSynthesisPrompt(
    originalQuery: string,
    documents: string[],
    reasoningTrace: ReasoningStep[],
  ): string {
    const traceText = this.formatReasoningTrace(reasoningTrace);

    const parts = [
      `以下の情報を統合して、ユーザーの質問に対する包括的で丁寧な日本語の回答を生成してください。`,
      '',
      `質問: ${originalQuery}`,
      '',
    ];

    if (traceText) {
      parts.push(`推論過程:`, traceText, '');
    }

    parts.push(
      `回答の最後に、確信度を0から1の数値で示してください。`,
      `フォーマット: [確信度: 0.XX]`,
    );

    return parts.join('\n');
  }

  /**
   * 推論トレースを読みやすいテキストに変換する
   */
  private formatReasoningTrace(trace: ReasoningStep[]): string {
    if (trace.length === 0) return '';

    return trace
      .map((step) => `[${step.type}] ${step.content}`)
      .join('\n');
  }

  // ---------------------------------------------------------------------------
  // LLMレスポンスのパース
  // ---------------------------------------------------------------------------

  /**
   * LLMレスポンスから回答テキストと確信度を抽出する
   */
  private parseLLMResponse(response: string): {
    answer: string;
    llmConfidence: number | null;
  } {
    let llmConfidence: number | null = null;
    let answer = response;

    // 確信度パターンを検出して抽出
    const confidenceMatch = response.match(
      /\[確信度[:：]\s*([\d.]+)\]/,
    );
    if (confidenceMatch) {
      const parsed = parseFloat(confidenceMatch[1]);
      if (!isNaN(parsed)) {
        llmConfidence = parsed;
      }
      // 確信度タグを回答から除去
      answer = response.replace(/\[確信度[:：]\s*[\d.]+\]/, '').trim();
    }

    return { answer: answer || '', llmConfidence };
  }

  // ---------------------------------------------------------------------------
  // 確信度の算出
  // ---------------------------------------------------------------------------

  /**
   * 検索結果とLLMの確信度から最終的な確信度を算出する
   *
   * 算出ロジック:
   * - 関連結果の数に基づくスコア（最大0.4）
   * - 最高スコアに基づくスコア（最大0.4）
   * - LLM確信度のボーナス（最大0.2）
   */
  private calculateConfidence(
    searchResults: SearchToolResult[],
    llmConfidence: number | null,
  ): number {
    const relevantResults = searchResults.filter((r) => r.hasRelevantResults);
    const relevantCount = relevantResults.length;
    const totalResults = searchResults.length;

    // 関連結果の割合に基づくスコア（最大0.4）
    const relevanceRatio =
      totalResults > 0 ? relevantCount / totalResults : 0;
    const relevanceScore = relevanceRatio * 0.4;

    // 最高スコアに基づくスコア（最大0.4）
    const bestScore = this.getBestScore(searchResults);
    const scoreComponent = bestScore * 0.4;

    // LLM確信度のボーナス（最大0.2）
    const llmBonus =
      llmConfidence !== null ? this.clampConfidence(llmConfidence) * 0.2 : 0.1;

    return relevanceScore + scoreComponent + llmBonus;
  }

  /**
   * 全検索結果から最高スコアを取得する
   */
  private getBestScore(searchResults: SearchToolResult[]): number {
    let best = 0;
    for (const result of searchResults) {
      if (result.bestScore > best) {
        best = result.bestScore;
      }
    }
    return best;
  }

  /**
   * 確信度を [0, 1] の範囲にクランプする
   */
  private clampConfidence(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  // ---------------------------------------------------------------------------
  // ドキュメント・ソース収集
  // ---------------------------------------------------------------------------

  /**
   * 全検索結果からドキュメントを収集する
   */
  private collectDocuments(searchResults: SearchToolResult[]): string[] {
    const documents: string[] = [];
    for (const result of searchResults) {
      for (const doc of result.documents) {
        if (doc && doc.trim().length > 0) {
          documents.push(doc);
        }
      }
    }
    return documents;
  }

  /**
   * 検索結果からユニークなソース情報を抽出する
   *
   * 各ドキュメントの先頭部分（最大80文字）をソース識別子として使用する。
   */
  private extractSources(searchResults: SearchToolResult[]): string[] {
    const sourceSet = new Set<string>();

    for (const result of searchResults) {
      for (const doc of result.documents) {
        if (doc && doc.trim().length > 0) {
          // ドキュメントの先頭部分をソース識別子として使用
          const snippet = doc.trim().substring(0, 80);
          const source = snippet.length < doc.trim().length
            ? `${snippet}...`
            : snippet;
          sourceSet.add(source);
        }
      }
    }

    return Array.from(sourceSet);
  }

  // ---------------------------------------------------------------------------
  // フォールバック
  // ---------------------------------------------------------------------------

  /**
   * LLM失敗時のフォールバック回答を構築する
   */
  private buildFallbackAnswer(documents: string[]): string {
    if (documents.length === 0) {
      return ResponseSynthesizer.DEFAULT_ANSWER;
    }

    // 上位ドキュメントを結合してフォールバック回答とする
    const topDocs = documents.slice(0, 3);
    const combined = topDocs.join('\n\n');

    return combined || ResponseSynthesizer.DEFAULT_ANSWER;
  }

  /**
   * LLM呼び出し失敗時のフォールバックレスポンスを生成する
   */
  private buildFallbackResponse(
    documents: string[],
    searchResults: SearchToolResult[],
    sources: string[],
  ): SynthesizedResponse {
    const answer = this.buildFallbackAnswer(documents);
    const bestScore = this.getBestScore(searchResults);

    // フォールバック時は確信度を低めに設定
    const confidence = this.clampConfidence(
      Math.min(bestScore * 0.5, ResponseSynthesizer.FALLBACK_CONFIDENCE),
    );

    return {
      answer,
      confidence,
      sources,
    };
  }
}
