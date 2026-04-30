# 実装計画: Retrieval-Based (Reasoning) AI

## 概要

ワンダーランド東京 FAQ AIチャットボットを、単純なRAGからReAct（Reasoning + Acting）パターンに基づく探索ベースAIに進化させる。段階的開発方針に従い、Phase 1（ReAct推論エンジン）→ Phase 2（LLMプロバイダー切り替え）→ Phase 3（推論特化モデル比較）の順で実装する。

## タスク

- [x] 1. 型定義とインターフェースの作成
  - [x] 1.1 ReAct推論エンジンの型定義を作成する
    - `lib/types/reasoning.ts` を新規作成
    - `ReasoningStep`、`ReasoningResult`、`ReasoningOptions`、`ParsedLLMResponse`、`ReActAction`、`QueryAnalysis`、`QueryIntent` の型・インターフェースを定義する
    - `SearchToolResult`、`SearchOptions`、`SynthesizedResponse` の型を定義する
    - _要件: 1.1, 1.4, 1.5, 1.6, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_
  - [x] 1.2 LLMプロバイダーの型定義を作成する
    - `lib/types/llmProvider.ts` を新規作成
    - `LLMProvider` インターフェース（`chatCompletion`、`getProviderName`、`getModelName`）を定義する
    - `ChatCompletionParams`、`ChatMessage`、`ChatCompletionResult`、`LLMProviderType`、`LLMProviderConfig` の型を定義する
    - _要件: 6.7, 7.4, 8.4_

- [ ] 2. Phase 1: ReActレスポンスパーサーの実装
  - [x] 2.1 ReActレスポンスパーサーを実装する
    - `lib/services/ReActParser.ts` を新規作成
    - `parseReActResponse(response: string): ParsedLLMResponse` 関数を実装する
    - `Thought:`、`Action: SEARCH`、`Action: REFINE`、`Final Answer:` の各セクションを正規表現でパースする
    - パース失敗時は例外をスローせず、可能な限り情報を抽出して返却する
    - `thought`、`action`、`finalAnswer` のうち少なくとも1つが非nullであることを保証する
    - _要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 2.2 ReActパーサーのプロパティテストを作成する
    - `lib/services/__tests__/ReActParser.property.test.ts` を新規作成
    - テストフレームワーク `fast-check` と `vitest` をインストール・設定する
    - **プロパティ 2: 回答非空** — 正しいReActフォーマットの入力に対して、パース結果のthought/action/finalAnswerのうち少なくとも1つが非null
    - **検証対象: 要件 4.5, 4.6**
  - [ ]* 2.3 ReActパーサーのユニットテストを作成する
    - `lib/services/__tests__/ReActParser.test.ts` を新規作成
    - Thought + Action: SEARCH のパースケース
    - Thought + Final Answer のパースケース
    - Action: REFINE のパースケース
    - 不正フォーマット入力時のグレースフルデグラデーション
    - _要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 3. Phase 1: SearchTool（検索ツール）の実装
  - [x] 3.1 SearchToolを実装する
    - `lib/services/SearchTool.ts` を新規作成
    - `EmbeddingService` と `EmbeddedVectorSearchService` を統合した `SearchTool` クラスを実装する
    - `search(query: string, options?: SearchOptions): Promise<SearchToolResult>` メソッドを実装する
    - 検索結果のスコアに基づいて `hasRelevantResults` と `bestScore` を設定する
    - _要件: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.2 SearchToolのユニットテストを作成する
    - `lib/services/__tests__/SearchTool.test.ts` を新規作成
    - EmbeddingService と VectorSearchService をモックして検索フローをテスト
    - 閾値以上/未満のスコアに対する `hasRelevantResults` の判定テスト
    - _要件: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Phase 1: QueryAnalyzer（質問分析）の実装
  - [x] 4.1 QueryAnalyzerを実装する
    - `lib/services/QueryAnalyzer.ts` を新規作成
    - `analyze(query: string): Promise<QueryAnalysis>` メソッドを実装する
    - LLMを使用して質問の意図（factual/comparison/procedural/exploratory）を分類する
    - 質問の複雑度（simple/moderate/complex）を判定する
    - 複雑な質問をサブクエリに分解し、キーワードを抽出する
    - _要件: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 4.2 QueryAnalyzerのユニットテストを作成する
    - `lib/services/__tests__/QueryAnalyzer.test.ts` を新規作成
    - LLMServiceをモックして各意図分類のテスト
    - 複雑度判定のテスト（simple/moderate/complex）
    - サブクエリ分解とキーワード抽出のテスト
    - _要件: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Phase 1: ResponseSynthesizer（回答合成）の実装
  - [x] 5.1 ResponseSynthesizerを実装する
    - `lib/services/ResponseSynthesizer.ts` を新規作成
    - `synthesize(originalQuery, searchResults, reasoningTrace): Promise<SynthesizedResponse>` メソッドを実装する
    - 複数の検索結果を統合して日本語の最終回答を生成する
    - 回答の確信度（0〜1）を算出し、参照ソース情報のリストを返却する
    - _要件: 5.1, 5.2, 5.3_
  - [ ]* 5.2 ResponseSynthesizerのユニットテストを作成する
    - `lib/services/__tests__/ResponseSynthesizer.test.ts` を新規作成
    - LLMServiceをモックして回答合成のテスト
    - 確信度の範囲（0〜1）のテスト
    - ソース情報の返却テスト
    - _要件: 5.1, 5.2, 5.3_

- [ ] 6. Phase 1: ReasoningEngine（推論エンジン）の実装
  - [x] 6.1 ReasoningEngineを実装する
    - `lib/services/ReasoningEngine.ts` を新規作成
    - `reason(query: string, options?: ReasoningOptions): Promise<ReasoningResult>` メソッドを実装する
    - QueryAnalyzer → 推論ループ（思考→アクション→観察）→ ResponseSynthesizer の全フローを制御する
    - 単純な質問（complexity === 'simple'）は1回の検索で回答を生成する
    - 最大イテレーション回数（デフォルト3回）の制御を実装する
    - タイムアウト制御を実装する
    - 各推論ステップをタイムスタンプ付きで記録する
    - 検索回数の正確なカウントを実装する
    - エラーハンドリング: パース失敗時のフォールバック回答、全検索失敗時のNO_RELEVANT_DATA、タイムアウト時の部分回答（confidence ≤ 0.3）、レート制限時の即座中断
    - _要件: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 10.1, 10.2, 10.3, 10.4_
  - [ ]* 6.2 ReasoningEngineのプロパティテストを作成する
    - `lib/services/__tests__/ReasoningEngine.property.test.ts` を新規作成
    - **プロパティ 1: 終了保証** — 任意の入力に対して推論ループが `maxIterations` 回以内で終了する
    - **プロパティ 5: 確信度範囲** — 任意の結果に対して confidence が [0, 1] 範囲内
    - **検証対象: 要件 1.2, 1.6**
  - [ ]* 6.3 ReasoningEngineのユニットテストを作成する
    - `lib/services/__tests__/ReasoningEngine.test.ts` を新規作成
    - 単純な質問で1回の検索のみ実行されるテスト
    - 最大イテレーション到達時の回答合成テスト
    - タイムアウト時の部分回答テスト（confidence ≤ 0.3）
    - パース失敗時のフォールバック回答テスト
    - レート制限エラー時の即座中断テスト
    - 推論ステップの時系列順記録テスト
    - _要件: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 10.1, 10.2, 10.3, 10.4_

- [x] 7. Phase 1: API Routeの統合とチェックポイント
  - [x] 7.1 チャットAPI Routeを更新してReasoningEngineを統合する
    - `app/api/chat/route.ts` を更新する
    - 既存のシーケンシャルな処理フロー（Embedding → VectorSearch → LLM）を `ReasoningEngine.reason()` 呼び出しに置き換える
    - デバッグモード（環境変数 `DEBUG_MODE`）が有効な場合のみ推論ステップをレスポンスに含める
    - 既存の `ChatResponse` インターフェース（response、sources、error、errorCode）を維持する
    - _要件: 9.3, 9.4, 11.3, 11.4, 12.1, 12.2, 12.3_
  - [x] 7.2 サービスのエクスポートを更新する
    - `lib/services/index.ts` を更新して新規サービス（ReasoningEngine、SearchTool、QueryAnalyzer、ResponseSynthesizer、ReActParser）をエクスポートする
    - _要件: 9.3_

- [x] 8. チェックポイント - Phase 1 完了確認
  - すべてのテストが通ることを確認し、ユーザーに質問があれば確認する。
  - Phase 1 の ReAct推論エンジンが Hugging Face + Qwen2.5-7B-Instruct で正常に動作することを確認する。

- [x] 9. Phase 2: LLMプロバイダー抽象化レイヤーの実装
  - [x] 9.1 HuggingFaceProviderを実装する
    - `lib/services/providers/HuggingFaceProvider.ts` を新規作成
    - `LLMProvider` インターフェースを実装する
    - `@huggingface/inference` SDK を使用して `chatCompletion` メソッドを実装する
    - メッセージ配列、maxTokens、temperatureパラメータをHugging Face APIに渡す
    - レート制限エラー（429）を識別可能なエラーとしてスローする
    - `getProviderName()` で `'huggingface'` を返却する
    - _要件: 7.1, 7.2, 7.3, 7.4_
  - [x] 9.2 OpenAICompatibleProviderを実装する
    - `lib/services/providers/OpenAICompatibleProvider.ts` を新規作成
    - `LLMProvider` インターフェースを実装する
    - `openai` パッケージをインストールし、指定された `baseURL` で `chatCompletion` リクエストを実行する
    - OpenRouter の場合は `HTTP-Referer` ヘッダーを付与する
    - `getProviderName()` で設定されたプロバイダー名（`'groq'` または `'openrouter'`）を返却する
    - _要件: 8.1, 8.2, 8.3, 8.4_
  - [x] 9.3 LLMProviderFactoryを実装する
    - `lib/services/providers/LLMProviderFactory.ts` を新規作成
    - `createFromEnv(): LLMProvider` メソッドを実装する
    - 環境変数 `LLM_PROVIDER` に基づいて適切なプロバイダーインスタンスを生成する
    - `LLM_PROVIDER` 未設定時は `HUGGINGFACE_API_KEY` にフォールバックする
    - `LLM_PROVIDER` 設定時に `LLM_API_KEY` が未設定の場合は明確なエラーメッセージをスローする
    - `LLM_MODEL` 未設定時はプロバイダーごとのデフォルトモデルを使用する
    - プロバイダーのデフォルト設定（baseURL、モデル名）を `PROVIDER_DEFAULTS` として定義する
    - _要件: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 9.4 プロバイダーのエクスポートファイルを作成する
    - `lib/services/providers/index.ts` を新規作成
    - HuggingFaceProvider、OpenAICompatibleProvider、LLMProviderFactory をエクスポートする

- [ ] 10. Phase 2: LLMServiceのリファクタリングと後方互換性
  - [x] 10.1 LLMServiceをリファクタリングしてプロバイダー抽象化を導入する
    - `lib/services/LLMService.ts` を更新する
    - 内部で `LLMProviderFactory` を使用してプロバイダーインスタンスを生成する
    - コンストラクタに `apiKey` パラメータが明示的に渡された場合は `HuggingFaceProvider` を使用する（後方互換）
    - 既存の `generateResponse` メソッドのインターフェースを維持する
    - `getProviderName()` メソッドを追加する
    - _要件: 9.1, 9.2, 9.3, 6.4_
  - [ ]* 10.2 LLMProviderFactoryのユニットテストを作成する
    - `lib/services/providers/__tests__/LLMProviderFactory.test.ts` を新規作成
    - 環境変数 `LLM_PROVIDER=huggingface` で HuggingFaceProvider が生成されるテスト
    - 環境変数 `LLM_PROVIDER=groq` で OpenAICompatibleProvider（Groq用baseURL）が生成されるテスト
    - 環境変数 `LLM_PROVIDER=openrouter` で OpenAICompatibleProvider（OpenRouter用baseURL）が生成されるテスト
    - `LLM_PROVIDER` 未設定時に `HUGGINGFACE_API_KEY` フォールバックのテスト
    - `LLM_PROVIDER` 設定時に `LLM_API_KEY` 未設定でエラーがスローされるテスト
    - `LLM_MODEL` 未設定時にデフォルトモデルが使用されるテスト
    - _要件: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 10.5, 10.6_
  - [ ]* 10.3 後方互換性のユニットテストを作成する
    - `lib/services/__tests__/LLMService.test.ts` を新規作成
    - `HUGGINGFACE_API_KEY` のみ設定時に HuggingFaceProvider が使用されるテスト
    - コンストラクタに `apiKey` を明示的に渡した場合に HuggingFaceProvider が使用されるテスト
    - `generateResponse` メソッドのインターフェースが維持されるテスト
    - _要件: 9.1, 9.2, 9.3_

- [ ] 11. Phase 2: 環境変数設定の更新
  - [x] 11.1 環境変数テンプレートを更新する
    - `.env.example` を更新して新しい環境変数（`LLM_PROVIDER`、`LLM_MODEL`、`LLM_API_KEY`、`DEBUG_MODE`）のテンプレートを追加する
    - 各プロバイダー（huggingface / groq / openrouter）の設定例をコメントで記載する
    - _要件: 6.1, 6.2, 6.3_

- [x] 12. チェックポイント - Phase 2 完了確認
  - すべてのテストが通ることを確認し、ユーザーに質問があれば確認する。
  - Phase 2 の LLMプロバイダー切り替え機能が正常に動作し、後方互換性が維持されていることを確認する。

- [ ] 13. Phase 3: 推論特化モデル比較ページの実装
  - [x] 13.1 LLMテストAPI Routeを更新する
    - `app/api/llm-test/route.ts` を更新する
    - 指定されたプロバイダー（huggingface / groq / openrouter）で ReasoningEngine を実行し、推論結果（回答、推論ステップ、検索回数、確信度、応答時間）を返却するエンドポイントを実装する
    - _要件: 6.1, 6.2, 6.3_
  - [x] 13.2 LLM比較ページを更新する
    - `app/llm-compare/page.tsx` を更新する
    - 各プロバイダー（Hugging Face / Groq / OpenRouter）の推論結果を並列表示する
    - 比較観点: 推論品質、応答速度、推論ステップ数、確信度を表示する
    - _要件: 6.1, 6.2, 6.3_
  - [ ]* 13.3 LLMテストAPIのユニットテストを作成する
    - `app/api/llm-test/__tests__/route.test.ts` を新規作成
    - 各プロバイダー指定時のレスポンス形式テスト
    - 無効なプロバイダー指定時のエラーハンドリングテスト
    - _要件: 10.5, 10.6_

- [x] 14. 最終チェックポイント - 全Phase完了確認
  - すべてのテストが通ることを確認し、ユーザーに質問があれば確認する。
  - Phase 1〜3 の全機能が正常に動作し、既存機能との互換性が維持されていることを確認する。

## 備考

- `*` マーク付きのタスクはオプションであり、MVP実装時にはスキップ可能
- 各タスクは具体的な要件を参照しており、トレーサビリティを確保
- チェックポイントで段階的な検証を実施
- プロパティテストは設計ドキュメントの正当性プロパティに基づく
- ユニットテストは具体的なケースとエッジケースを検証
