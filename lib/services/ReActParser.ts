/**
 * ReActレスポンスパーサー
 *
 * LLMのReActフォーマット出力をパースし、構造化データ（ParsedLLMResponse）に変換する。
 * パース失敗時は例外をスローせず、可能な限り情報を抽出して返却する（graceful degradation）。
 *
 * 対応セクション:
 * - Thought: 思考内容
 * - Action: SEARCH / REFINE + Action Input:
 * - Final Answer: 最終回答
 *
 * @module ReActParser
 */

import type { ParsedLLMResponse, ReActAction } from '@/lib/types/reasoning';

/**
 * LLMのReActレスポンスをパースする。
 *
 * パース優先順位:
 * 1. Thought セクションを抽出
 * 2. Final Answer セクションがあれば抽出して即座に返却（最優先）
 * 3. Action + Action Input セクションを抽出
 *
 * すべてのフィールドがnullの場合、レスポンス全体をthoughtとして設定し、
 * 少なくとも1つのフィールドが非nullであることを保証する（要件 4.5, 4.6）。
 *
 * @param response - LLMからのReActフォーマット出力文字列
 * @returns パース結果の構造化データ
 */
export function parseReActResponse(response: string): ParsedLLMResponse {
  const result: ParsedLLMResponse = {
    thought: null,
    action: null,
    finalAnswer: null,
  };

  // Thought 抽出: "Thought:" から次の "Action:" または "Final Answer:" または末尾まで
  // [\s\S] を使用して改行を含む任意の文字にマッチ（ES2017互換）
  const thoughtMatch = response.match(/Thought:\s*([\s\S]+?)(?=\nAction:|\nFinal Answer:|$)/);
  if (thoughtMatch) {
    result.thought = thoughtMatch[1].trim() || null;
  }

  // Final Answer 抽出（優先）: "Final Answer:" から末尾まで
  const answerMatch = response.match(/Final Answer:\s*([\s\S]+?)$/);
  if (answerMatch) {
    const answer = answerMatch[1].trim();
    if (answer) {
      result.finalAnswer = answer;
      // Final Answer が見つかった場合は thought と共に即座に返却
      return ensureNonEmpty(result, response);
    }
  }

  // Action 抽出: "Action: SEARCH|REFINE" + "Action Input: ..."
  const actionMatch = response.match(
    /Action:\s*(SEARCH|REFINE)\s*\nAction Input:\s*([\s\S]+?)(?=\n|$)/,
  );
  if (actionMatch) {
    const actionType = actionMatch[1] as 'SEARCH' | 'REFINE';
    const actionInput = actionMatch[2].trim();

    if (actionInput) {
      let action: ReActAction;
      if (actionType === 'SEARCH') {
        action = { type: 'SEARCH', query: actionInput };
      } else {
        action = { type: 'REFINE', originalQuery: '', refinedQuery: actionInput };
      }
      result.action = action;
    }
  }

  return ensureNonEmpty(result, response);
}

/**
 * パース結果のうち少なくとも1つのフィールドが非nullであることを保証する。
 * すべてnullの場合、レスポンス全体をthoughtとして設定する（graceful degradation）。
 *
 * @param result - パース結果
 * @param response - 元のレスポンス文字列
 * @returns 少なくとも1つのフィールドが非nullであるパース結果
 */
function ensureNonEmpty(
  result: ParsedLLMResponse,
  response: string,
): ParsedLLMResponse {
  if (
    result.thought === null &&
    result.action === null &&
    result.finalAnswer === null
  ) {
    // すべてnullの場合、レスポンス全体をthoughtとして使用
    result.thought = response.trim() || response;
  }
  return result;
}
