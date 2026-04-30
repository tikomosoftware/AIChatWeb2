import type { QueryAnalysis, QueryIntent } from '@/lib/types/reasoning';
import { LLMService } from '@/lib/services/LLMService';

/**
 * QueryAnalyzer — ユーザーの質問を分析し、検索戦略を決定する
 *
 * LLMを使用して質問の意図分類・複雑度判定・サブクエリ分解・キーワード抽出を行う。
 * LLMのJSON出力が得られない場合はヒューリスティック分析にフォールバックする。
 */
export class QueryAnalyzer {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * ユーザーの質問を分析し、QueryAnalysis を返す
   */
  async analyze(query: string): Promise<QueryAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(query);
      const response = await this.llmService.generateResponse(prompt, []);
      const parsed = this.parseJsonResponse(response);

      if (parsed) {
        return this.validateAndNormalize(parsed, query);
      }
    } catch {
      // LLM呼び出しまたはパースに失敗した場合、ヒューリスティック分析にフォールバック
    }

    return this.heuristicAnalysis(query);
  }

  // ---------------------------------------------------------------------------
  // プロンプト構築
  // ---------------------------------------------------------------------------

  /**
   * LLMに送信する質問分析プロンプトを構築する
   */
  private buildAnalysisPrompt(query: string): string {
    return `以下のユーザーの質問を分析して、JSON形式で結果を返してください。

質問: "${query}"

以下のJSON形式で回答してください（JSON以外のテキストは含めないでください）:
{
  "intent": "factual | comparison | procedural | exploratory のいずれか",
  "complexity": "simple | moderate | complex のいずれか",
  "subQueries": ["サブクエリ1", "サブクエリ2"],
  "keywords": ["キーワード1", "キーワード2"]
}

intentの判定基準:
- factual: 事実確認の質問（営業時間、料金、場所など）
- comparison: 比較の質問（AとBの違い、どちらがおすすめかなど）
- procedural: 手順・方法の質問（チケットの買い方、行き方など）
- exploratory: 探索的な質問（おすすめ、楽しみ方など）

complexityの判定基準:
- simple: 単一の情報で回答できる質問
- moderate: 2つ程度の情報を組み合わせる質問
- complex: 3つ以上の情報や複数の観点が必要な質問

subQueries: 質問がcomplexまたはmoderateの場合、分解したサブクエリを配列で返してください。simpleの場合は空配列。
keywords: 質問から抽出した重要キーワードを配列で返してください。`;
  }

  // ---------------------------------------------------------------------------
  // JSONパース
  // ---------------------------------------------------------------------------

  /**
   * LLMレスポンスからJSONをパースする
   */
  private parseJsonResponse(response: string): Partial<QueryAnalysis> | null {
    try {
      // レスポンスからJSON部分を抽出（コードブロックやテキストに囲まれている場合に対応）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as Partial<QueryAnalysis>;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // バリデーション・正規化
  // ---------------------------------------------------------------------------

  private static readonly VALID_INTENTS: ReadonlySet<QueryIntent> = new Set([
    'factual',
    'comparison',
    'procedural',
    'exploratory',
  ]);

  private static readonly VALID_COMPLEXITIES: ReadonlySet<string> = new Set([
    'simple',
    'moderate',
    'complex',
  ]);

  /**
   * パース結果をバリデーションし、不足フィールドを補完する
   */
  private validateAndNormalize(
    parsed: Partial<QueryAnalysis>,
    query: string,
  ): QueryAnalysis {
    const heuristic = this.heuristicAnalysis(query);

    const intent: QueryIntent = QueryAnalyzer.VALID_INTENTS.has(parsed.intent as QueryIntent)
      ? (parsed.intent as QueryIntent)
      : heuristic.intent;

    const complexity = QueryAnalyzer.VALID_COMPLEXITIES.has(parsed.complexity as string)
      ? (parsed.complexity as 'simple' | 'moderate' | 'complex')
      : heuristic.complexity;

    const subQueries = Array.isArray(parsed.subQueries)
      ? parsed.subQueries.filter((q): q is string => typeof q === 'string' && q.length > 0)
      : heuristic.subQueries;

    const keywords = Array.isArray(parsed.keywords) && parsed.keywords.length > 0
      ? parsed.keywords.filter((k): k is string => typeof k === 'string' && k.length > 0)
      : heuristic.keywords;

    return { intent, complexity, subQueries, keywords };
  }

  // ---------------------------------------------------------------------------
  // ヒューリスティック分析（フォールバック）
  // ---------------------------------------------------------------------------

  /**
   * LLMを使わずにキーワードマッチングとルールベースで質問を分析する
   */
  private heuristicAnalysis(query: string): QueryAnalysis {
    const intent = this.classifyIntentByKeywords(query);
    const complexity = this.estimateComplexity(query);
    const subQueries = this.decomposeQuery(query, complexity);
    const keywords = this.extractKeywords(query);

    return { intent, complexity, subQueries, keywords };
  }

  /**
   * キーワードマッチングで意図を分類する
   */
  private classifyIntentByKeywords(query: string): QueryIntent {
    // 比較系キーワード
    const comparisonKeywords = ['比較', '違い', 'どちら', 'どっち', 'それぞれ', 'vs', '対', '差'];
    if (comparisonKeywords.some((kw) => query.includes(kw))) {
      return 'comparison';
    }

    // 手順系キーワード
    const proceduralKeywords = ['方法', '手順', 'やり方', '仕方', 'どうやって', 'どうすれば', '手続き', '流れ', '買い方', '行き方', '使い方'];
    if (proceduralKeywords.some((kw) => query.includes(kw))) {
      return 'procedural';
    }

    // 探索系キーワード
    const exploratoryKeywords = ['おすすめ', 'おススメ', 'オススメ', '楽しみ方', '見どころ', '人気', 'ランキング', '教えて'];
    if (exploratoryKeywords.some((kw) => query.includes(kw))) {
      return 'exploratory';
    }

    // デフォルトは事実確認
    return 'factual';
  }

  /**
   * クエリの長さと構造から複雑度を推定する
   */
  private estimateComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const questionMarks = (query.match(/？|\?/g) || []).length;
    const conjunctions = (query.match(/と|や|また|さらに|それから/g) || []).length;
    const length = query.length;

    // 複数の疑問符や接続詞が多い場合は複雑
    if (questionMarks >= 2 || conjunctions >= 2 || length > 80) {
      return 'complex';
    }

    // 中程度の長さや1つの接続詞がある場合
    if (conjunctions >= 1 || length > 40) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * 複雑な質問をサブクエリに分解する
   */
  private decomposeQuery(
    query: string,
    complexity: 'simple' | 'moderate' | 'complex',
  ): string[] {
    if (complexity === 'simple') {
      return [];
    }

    // 「と」「や」「、」で区切ってサブクエリを生成
    const parts = query.split(/[、。とや]/).filter((p) => p.trim().length > 2);
    if (parts.length > 1) {
      return parts.map((p) => p.trim());
    }

    // 分割できない場合はそのまま返す
    return [query];
  }

  /**
   * クエリからキーワードを抽出する
   *
   * 助詞・助動詞・記号を除去し、意味のある語句を抽出する。
   */
  private extractKeywords(query: string): string[] {
    // 一般的な助詞・助動詞・記号を除去
    const stopWords = [
      'の', 'は', 'が', 'を', 'に', 'で', 'と', 'も', 'や', 'か',
      'です', 'ます', 'した', 'する', 'して', 'される', 'された',
      'ある', 'いる', 'なる', 'ない', 'ください',
      'この', 'その', 'あの', 'どの',
      'これ', 'それ', 'あれ', 'どれ',
      'こと', 'もの', 'ため', 'よう',
      'について', 'に関して', 'とは',
      '教えて', '知りたい', '何',
    ];

    // 記号・疑問符を除去
    const cleaned = query.replace(/[？?！!、。「」『』（）\(\)\s]/g, ' ');

    // スペースで分割し、ストップワードを除去
    const words = cleaned
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.includes(w));

    // 重複を除去
    return Array.from(new Set(words));
  }
}
