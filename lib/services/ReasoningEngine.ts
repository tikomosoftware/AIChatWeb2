/**
 * ReasoningEngine — ReActパターンに基づく多段階推論エンジン
 *
 * ユーザーの質問に対して「思考→アクション→観察」のサイクルを繰り返し、
 * 段階的に情報を収集・推論して最終回答を生成するメインオーケストレーター。
 *
 * フロー: QueryAnalyzer → 推論ループ（think→action→observe）→ ResponseSynthesizer
 *
 * @module ReasoningEngine
 */

import type {
  ReasoningResult,
  ReasoningOptions,
  ReasoningStep,
  SearchToolResult,
  QueryAnalysis,
} from '@/lib/types/reasoning';
import { SearchTool } from '@/lib/services/SearchTool';
import { QueryAnalyzer } from '@/lib/services/QueryAnalyzer';
import { ResponseSynthesizer } from '@/lib/services/ResponseSynthesizer';
import { LLMService } from '@/lib/services/LLMService';
import { parseReActResponse } from '@/lib/services/ReActParser';
import { ErrorCode, ERROR_MESSAGES } from '@/lib/types/errors';

/** ReasoningEngine の依存サービス */
export interface ReasoningEngineDeps {
  llmService: LLMService;
  searchTool: SearchTool;
  queryAnalyzer: QueryAnalyzer;
  responseSynthesizer: ResponseSynthesizer;
}

/** ReasoningResult にエラーコードを付加した内部型 */
interface ReasoningResultWithError extends ReasoningResult {
  errorCode?: string;
}

/** デフォルトの最大イテレーション回数 */
const DEFAULT_MAX_ITERATIONS = 3;

/** タイムアウト時の最大確信度 */
const TIMEOUT_MAX_CONFIDENCE = 0.3;

export class ReasoningEngine {
  private llmService: LLMService;
  private searchTool: SearchTool;
  private queryAnalyzer: QueryAnalyzer;
  private responseSynthesizer: ResponseSynthesizer;

  constructor(deps: ReasoningEngineDeps) {
    this.llmService = deps.llmService;
    this.searchTool = deps.searchTool;
    this.queryAnalyzer = deps.queryAnalyzer;
    this.responseSynthesizer = deps.responseSynthesizer;
  }

  /**
   * ReAct推論ループを実行し、最終回答を生成する
   *
   * @param query - ユーザーの質問
   * @param options - 推論オプション（maxIterations, timeout, verbose）
   * @returns 推論結果（回答、ソース、推論ステップ、検索回数、確信度）
   */
  async reason(
    query: string,
    options?: ReasoningOptions,
  ): Promise<ReasoningResultWithError> {
    const maxIterations = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    const timeout = options?.timeout;
    const startTime = Date.now();

    const reasoningSteps: ReasoningStep[] = [];
    const allSearchResults: SearchToolResult[] = [];
    let currentContext = '';
    let iteration = 0;

    try {
      // ---------------------------------------------------------------
      // Step 1: 質問分析
      // ---------------------------------------------------------------
      const analysis = await this.queryAnalyzer.analyze(query);

      // ---------------------------------------------------------------
      // 単純な質問の最適化（要件 2.5）
      // ---------------------------------------------------------------
      if (analysis.complexity === 'simple') {
        const result = await this.searchTool.search(query);
        if (result.hasRelevantResults) {
          const response = await this.responseSynthesizer.synthesize(
            query,
            [result],
            [],
          );
          return {
            answer: response.answer,
            sources: response.sources,
            reasoningSteps: [],
            totalSearches: 1,
            confidence: response.confidence,
          };
        }
      }

      // ---------------------------------------------------------------
      // Step 2: 推論ループ
      // ---------------------------------------------------------------
      while (iteration < maxIterations) {
        // タイムアウトチェック
        if (timeout && Date.now() - startTime >= timeout) {
          return this.buildTimeoutResult(
            query,
            allSearchResults,
            reasoningSteps,
          );
        }

        iteration++;

        // Think: LLMに次のアクションを決定させる
        let parsed;
        try {
          const reactPrompt = this.buildReActPrompt(
            query,
            currentContext,
            analysis,
          );
          const llmResponse = await this.llmService.generateResponse(
            reactPrompt,
            [],
          );
          parsed = parseReActResponse(llmResponse);
        } catch (error) {
          // レート制限エラーは即座に中断（要件 10.4）
          if (this.isRateLimitError(error)) {
            return this.buildRateLimitResult(reasoningSteps, allSearchResults);
          }
          // その他のLLMエラー → パース失敗として扱い、ループを抜ける
          break;
        }

        // 思考ステップ記録
        if (parsed.thought) {
          reasoningSteps.push({
            stepNumber: reasoningSteps.length + 1,
            type: 'thought',
            content: parsed.thought,
            timestamp: Date.now(),
          });
        }

        // 最終回答が得られた場合 → ループ終了
        if (parsed.finalAnswer) {
          return this.buildFinalResult(
            parsed.finalAnswer,
            allSearchResults,
            reasoningSteps,
          );
        }

        // アクション実行
        if (parsed.action && parsed.action.type !== 'DONE') {
          const searchQuery =
            parsed.action.type === 'SEARCH'
              ? parsed.action.query
              : parsed.action.refinedQuery;

          reasoningSteps.push({
            stepNumber: reasoningSteps.length + 1,
            type: 'action',
            content: `SEARCH: ${searchQuery}`,
            timestamp: Date.now(),
          });

          try {
            const searchResult = await this.searchTool.search(searchQuery);
            allSearchResults.push(searchResult);

            // 観察: 検索結果をコンテキストに追加
            currentContext += this.formatSearchResults(searchResult);
            reasoningSteps.push({
              stepNumber: reasoningSteps.length + 1,
              type: 'observation',
              content: `${searchResult.documents.length}件の結果取得 (最高スコア: ${searchResult.bestScore.toFixed(3)})`,
              timestamp: Date.now(),
            });
          } catch (error) {
            // 検索エラーは記録して続行
            if (this.isRateLimitError(error)) {
              return this.buildRateLimitResult(reasoningSteps, allSearchResults);
            }
            reasoningSteps.push({
              stepNumber: reasoningSteps.length + 1,
              type: 'observation',
              content: '検索エラーが発生しました',
              timestamp: Date.now(),
            });
          }
        }

        // パース結果が何も得られなかった場合 → フォールバック
        if (!parsed.thought && !parsed.action && !parsed.finalAnswer) {
          break;
        }
      }

      // ---------------------------------------------------------------
      // 最大イテレーション到達 or フォールバック: 収集した情報で回答合成
      // ---------------------------------------------------------------
      return this.buildSynthesizedResult(
        query,
        allSearchResults,
        reasoningSteps,
      );
    } catch (error) {
      // 最上位のエラーハンドリング
      if (this.isRateLimitError(error)) {
        return this.buildRateLimitResult(reasoningSteps, allSearchResults);
      }

      // タイムアウトエラー
      if (
        error instanceof Error &&
        error.message.includes('TIMEOUT_ERROR')
      ) {
        return this.buildTimeoutResult(
          query,
          allSearchResults,
          reasoningSteps,
        );
      }

      // その他のエラー → 収集済み情報で回答を試みる
      return this.buildSynthesizedResult(
        query,
        allSearchResults,
        reasoningSteps,
      );
    }
  }

  // =========================================================================
  // ヘルパーメソッド
  // =========================================================================

  /**
   * ReActプロンプトを構築する
   */
  private buildReActPrompt(
    query: string,
    currentContext: string,
    analysis: QueryAnalysis,
  ): string {
    const systemPrompt = `あなたはワンダーランド東京のFAQアシスタントです。
ユーザーの質問に答えるために、段階的に考え、必要な情報を検索してください。

以下のフォーマットで回答してください：

Thought: [現在の状況と次に何をすべきかの考え]
Action: SEARCH
Action Input: [検索クエリ]

または、十分な情報が集まった場合：

Thought: [最終的な考え]
Final Answer: [ユーザーへの回答]

ルール:
- コンテキストに含まれない情報は推測しないでください
- 検索結果が不十分な場合は、別の角度から検索してください
- 最終回答は日本語で、丁寧に回答してください`;

    const contextSection = currentContext
      ? `\nこれまでに得られた情報:\n${currentContext}\n`
      : '';

    const userPrompt = `質問: ${query}
質問の意図: ${analysis.intent}
キーワード: ${analysis.keywords.join(', ')}
${contextSection}
次のステップを決定してください。`;

    return `${systemPrompt}\n\n${userPrompt}`;
  }

  /**
   * 検索結果をコンテキスト文字列にフォーマットする
   */
  private formatSearchResults(result: SearchToolResult): string {
    if (result.documents.length === 0) {
      return '\n[検索結果なし]\n';
    }

    const formatted = result.documents
      .map((doc, i) => `[結果${i + 1}] (スコア: ${result.scores[i]?.toFixed(3) ?? 'N/A'})\n${doc}`)
      .join('\n\n');

    return `\n--- 検索結果 ---\n${formatted}\n--- 検索結果ここまで ---\n`;
  }

  /**
   * LLMの最終回答から ReasoningResult を構築する
   */
  private buildFinalResult(
    answer: string,
    searchResults: SearchToolResult[],
    steps: ReasoningStep[],
  ): ReasoningResultWithError {
    // ソース情報を検索結果から抽出
    const sources = this.extractSources(searchResults);

    // 確信度を検索結果のスコアから算出
    const confidence = this.calculateConfidence(searchResults);

    return {
      answer,
      sources,
      reasoningSteps: steps,
      totalSearches: searchResults.length,
      confidence,
    };
  }

  /**
   * 収集した検索結果から ResponseSynthesizer で回答を合成する
   */
  private async buildSynthesizedResult(
    query: string,
    searchResults: SearchToolResult[],
    steps: ReasoningStep[],
  ): Promise<ReasoningResultWithError> {
    // 検索結果がない、または関連結果がない場合 → NO_RELEVANT_DATA
    const hasAnyRelevant = searchResults.some((r) => r.hasRelevantResults);
    if (searchResults.length === 0 || !hasAnyRelevant) {
      return {
        answer: ERROR_MESSAGES[ErrorCode.NO_RELEVANT_DATA],
        sources: [],
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: 0,
        errorCode: ErrorCode.NO_RELEVANT_DATA,
      };
    }

    try {
      const response = await this.responseSynthesizer.synthesize(
        query,
        searchResults,
        steps,
      );
      return {
        answer: response.answer,
        sources: response.sources,
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: response.confidence,
      };
    } catch {
      // 合成失敗時もNO_RELEVANT_DATAとして返す
      return {
        answer: ERROR_MESSAGES[ErrorCode.NO_RELEVANT_DATA],
        sources: [],
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: 0,
        errorCode: ErrorCode.NO_RELEVANT_DATA,
      };
    }
  }

  /**
   * タイムアウト時の部分回答を構築する（確信度 ≤ 0.3）
   */
  private async buildTimeoutResult(
    query: string,
    searchResults: SearchToolResult[],
    steps: ReasoningStep[],
  ): Promise<ReasoningResultWithError> {
    steps.push({
      stepNumber: steps.length + 1,
      type: 'observation',
      content: 'タイムアウトにより推論ループを終了しました',
      timestamp: Date.now(),
    });

    if (searchResults.length === 0 || !searchResults.some((r) => r.hasRelevantResults)) {
      return {
        answer: ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR],
        sources: [],
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: 0,
        errorCode: ErrorCode.TIMEOUT_ERROR,
      };
    }

    try {
      const response = await this.responseSynthesizer.synthesize(
        query,
        searchResults,
        steps,
      );
      return {
        answer: response.answer,
        sources: response.sources,
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: Math.min(response.confidence, TIMEOUT_MAX_CONFIDENCE),
        errorCode: ErrorCode.TIMEOUT_ERROR,
      };
    } catch {
      return {
        answer: ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR],
        sources: [],
        reasoningSteps: steps,
        totalSearches: searchResults.length,
        confidence: 0,
        errorCode: ErrorCode.TIMEOUT_ERROR,
      };
    }
  }

  /**
   * レート制限エラー時の結果を構築する
   */
  private buildRateLimitResult(
    steps: ReasoningStep[],
    searchResults: SearchToolResult[],
  ): ReasoningResultWithError {
    steps.push({
      stepNumber: steps.length + 1,
      type: 'observation',
      content: 'レート制限により推論ループを中断しました',
      timestamp: Date.now(),
    });

    return {
      answer: ERROR_MESSAGES[ErrorCode.RATE_LIMIT_ERROR],
      sources: [],
      reasoningSteps: steps,
      totalSearches: searchResults.length,
      confidence: 0,
      errorCode: ErrorCode.RATE_LIMIT_ERROR,
    };
  }

  /**
   * エラーがレート制限エラーかどうかを判定する
   */
  private isRateLimitError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.includes('RATE_LIMIT_ERROR')
    );
  }

  /**
   * 検索結果からソース情報を抽出する
   */
  private extractSources(searchResults: SearchToolResult[]): string[] {
    const sourceSet = new Set<string>();

    for (const result of searchResults) {
      for (const doc of result.documents) {
        if (doc && doc.trim().length > 0) {
          const snippet = doc.trim().substring(0, 80);
          const source =
            snippet.length < doc.trim().length ? `${snippet}...` : snippet;
          sourceSet.add(source);
        }
      }
    }

    return Array.from(sourceSet);
  }

  /**
   * 検索結果のスコアから確信度を算出する
   */
  private calculateConfidence(searchResults: SearchToolResult[]): number {
    if (searchResults.length === 0) return 0;

    const relevantResults = searchResults.filter((r) => r.hasRelevantResults);
    if (relevantResults.length === 0) return 0;

    const bestScore = Math.max(...searchResults.map((r) => r.bestScore));
    const relevanceRatio = relevantResults.length / searchResults.length;

    // 最高スコア（0.6重み）+ 関連結果の割合（0.4重み）
    const confidence = bestScore * 0.6 + relevanceRatio * 0.4;

    return Math.max(0, Math.min(1, confidence));
  }
}
