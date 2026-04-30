# 要件ドキュメント: Retrieval-Based (Reasoning) AI

## はじめに

ワンダーランド東京 FAQ AIチャットボットを、現在の単純なRAG（Retrieval-Augmented Generation）方式から、ReAct（Reasoning + Acting）パターンに基づく探索ベースAIに進化させる。ユーザーの質問に対して多段階推論を行い、必要に応じて複数回の検索を実行し、検索結果を評価・統合して最終回答を生成する。さらに、LLMプロバイダー切り替え機能を導入し、Hugging Face / Groq / OpenRouter を環境変数の設定のみで切り替え可能にする。

## 用語集

- **ReasoningEngine**: ReActパターンに基づく多段階推論を制御するメインオーケストレーターコンポーネント
- **QueryAnalyzer**: ユーザーの質問を分析し、意図分類・サブクエリ分解・キーワード抽出・複雑度判定を行うコンポーネント
- **SearchTool**: EmbeddingServiceとEmbeddedVectorSearchServiceを統合し、クエリのベクトル化と類似度検索を一括実行するコンポーネント
- **ResponseSynthesizer**: 推論過程と検索結果を統合して最終回答を生成するコンポーネント
- **LLMProviderFactory**: 環境変数に基づいて適切なLLMプロバイダーインスタンスを生成するファクトリーコンポーネント
- **LLMProvider**: Hugging Face、Groq、OpenRouterの各LLMサービスへの共通インターフェース
- **HuggingFaceProvider**: Hugging Face Inference APIを使用したLLMProvider実装
- **OpenAICompatibleProvider**: OpenAI互換APIを使用したLLMProvider実装（Groq、OpenRouter共通）
- **ReActパターン**: 「思考（Thought）→ アクション（Action）→ 観察（Observation）」のサイクルを繰り返す推論パターン
- **ParsedLLMResponse**: LLMのReActフォーマット出力をパースした構造化データ
- **ReasoningStep**: 推論ループ中の各ステップ（思考・アクション・観察）を記録するデータ構造
- **QueryAnalysis**: 質問分析の結果（意図、サブクエリ、キーワード、複雑度）を格納するデータ構造
- **ChatResponse**: フロントエンドに返却されるチャット応答データ

## 要件

### 要件 1: ReAct推論ループの制御

**ユーザーストーリー:** 開発者として、ReActパターンに基づく多段階推論エンジンを使用したい。それにより、複雑な質問に対しても段階的に情報を収集・推論して正確な回答を提供できるようになる。

#### 受け入れ基準

1. WHEN ユーザーの質問を受信した場合、THE ReasoningEngine SHALL 質問分析・検索・回答合成の推論ループを実行して最終回答を生成する
2. THE ReasoningEngine SHALL 推論ループを最大イテレーション回数（デフォルト3回）以内で終了する
3. WHEN 推論ループが完了した場合、THE ReasoningEngine SHALL 空でない文字列の回答を返却する
4. THE ReasoningEngine SHALL 各推論ステップ（思考・アクション・観察）をタイムスタンプ付きで時系列順に記録する
5. THE ReasoningEngine SHALL 実行した検索回数を正確にカウントし、ReasoningResultのtotalSearchesフィールドに設定する
6. THE ReasoningEngine SHALL 回答の確信度を0以上1以下の数値で算出する

### 要件 2: 質問分析

**ユーザーストーリー:** ユーザーとして、単純な質問には素早く回答を得たい。また、複雑な質問に対しても適切に分析されて正確な回答を得たい。

#### 受け入れ基準

1. WHEN ユーザーの質問を受信した場合、THE QueryAnalyzer SHALL 質問の意図をfactual、comparison、procedural、exploratoryのいずれかに分類する
2. WHEN ユーザーの質問を受信した場合、THE QueryAnalyzer SHALL 質問の複雑度をsimple、moderate、complexのいずれかに判定する
3. WHEN 複雑な質問を受信した場合、THE QueryAnalyzer SHALL 質問を複数のサブクエリに分解する
4. WHEN ユーザーの質問を受信した場合、THE QueryAnalyzer SHALL 質問から重要キーワードを抽出する
5. WHEN 質問の複雑度がsimpleと判定され、かつ検索結果に関連情報が存在する場合、THE ReasoningEngine SHALL 1回の検索のみで回答を生成する

### 要件 3: 検索ツールの統合

**ユーザーストーリー:** 開発者として、EmbeddingServiceとVectorSearchServiceを統合した検索インターフェースを使用したい。それにより、推論エンジンから簡潔に検索を実行できるようになる。

#### 受け入れ基準

1. WHEN 検索クエリを受信した場合、THE SearchTool SHALL クエリをベクトル化し、類似度検索を実行して結果を返却する
2. WHEN 検索が完了した場合、THE SearchTool SHALL 検索結果にドキュメント、スコア、関連性の有無を含める
3. WHEN 検索結果のスコアが閾値未満の場合、THE SearchTool SHALL hasRelevantResultsをfalseに設定する
4. WHEN 検索結果のスコアが閾値以上の場合、THE SearchTool SHALL hasRelevantResultsをtrueに設定し、bestScoreに最高スコアを設定する

### 要件 4: ReActレスポンスのパース

**ユーザーストーリー:** 開発者として、LLMのReActフォーマット出力を確実にパースしたい。それにより、推論ループの各ステップを正しく制御できるようになる。

#### 受け入れ基準

1. WHEN LLMの出力に「Thought:」セクションが含まれる場合、THE ReActパーサー SHALL 思考内容を抽出してParsedLLMResponseのthoughtフィールドに設定する
2. WHEN LLMの出力に「Final Answer:」セクションが含まれる場合、THE ReActパーサー SHALL 最終回答を抽出してParsedLLMResponseのfinalAnswerフィールドに設定する
3. WHEN LLMの出力に「Action: SEARCH」と「Action Input:」が含まれる場合、THE ReActパーサー SHALL 検索アクションとクエリを抽出してParsedLLMResponseのactionフィールドに設定する
4. WHEN LLMの出力に「Action: REFINE」と「Action Input:」が含まれる場合、THE ReActパーサー SHALL リファインアクションと改善クエリを抽出してParsedLLMResponseのactionフィールドに設定する
5. WHEN LLMの出力が期待されるReActフォーマットに従わない場合、THE ReActパーサー SHALL 例外をスローせずにParsedLLMResponseを返却する
6. THE ReActパーサー SHALL パース結果のthought、action、finalAnswerのうち少なくとも1つが非nullであることを保証する

### 要件 5: 回答合成

**ユーザーストーリー:** ユーザーとして、複数の検索結果から統合された正確で丁寧な日本語の回答を得たい。

#### 受け入れ基準

1. WHEN 検索結果と推論過程が提供された場合、THE ResponseSynthesizer SHALL 複数の検索結果を統合して最終回答を日本語で生成する
2. WHEN 回答を生成した場合、THE ResponseSynthesizer SHALL 回答の確信度を0以上1以下の数値で算出する
3. WHEN 回答を生成した場合、THE ResponseSynthesizer SHALL 参照したソース情報のリストを返却する

### 要件 6: LLMプロバイダー切り替え

**ユーザーストーリー:** 開発者として、環境変数の設定のみでLLMプロバイダー（Hugging Face / Groq / OpenRouter）を切り替えたい。それにより、異なるモデルの推論品質・速度を容易に比較検証できるようになる。

#### 受け入れ基準

1. WHEN 環境変数LLM_PROVIDERが「huggingface」に設定されている場合、THE LLMProviderFactory SHALL HuggingFaceProviderインスタンスを生成する
2. WHEN 環境変数LLM_PROVIDERが「groq」に設定されている場合、THE LLMProviderFactory SHALL OpenAICompatibleProviderインスタンスをGroq用のbaseURLで生成する
3. WHEN 環境変数LLM_PROVIDERが「openrouter」に設定されている場合、THE LLMProviderFactory SHALL OpenAICompatibleProviderインスタンスをOpenRouter用のbaseURLで生成する
4. WHEN 環境変数LLM_PROVIDERが設定されていない場合、THE LLMProviderFactory SHALL HUGGINGFACE_API_KEY環境変数にフォールバックしてHuggingFaceProviderを生成する
5. WHEN 環境変数LLM_PROVIDERが設定されているがLLM_API_KEYが未設定の場合、THE LLMProviderFactory SHALL 明確なエラーメッセージと共にエラーをスローする
6. WHEN 環境変数LLM_MODELが未設定の場合、THE LLMProviderFactory SHALL プロバイダーごとのデフォルトモデルを使用する
7. THE LLMProvider SHALL chatCompletionメソッドを通じてプロバイダー非依存のインターフェースを提供する

### 要件 7: HuggingFaceProvider

**ユーザーストーリー:** 開発者として、Hugging Face Inference APIを使用したLLMプロバイダーを利用したい。それにより、既存のHugging Face無料枠を活用してReAct推論を実行できるようになる。

#### 受け入れ基準

1. THE HuggingFaceProvider SHALL @huggingface/inference SDKを使用してchatCompletionリクエストを実行する
2. WHEN chatCompletionが呼び出された場合、THE HuggingFaceProvider SHALL メッセージ配列、maxTokens、temperatureパラメータをHugging Face APIに渡す
3. WHEN Hugging Face APIがレート制限エラーを返した場合、THE HuggingFaceProvider SHALL レート制限エラーとして識別可能なエラーをスローする
4. THE HuggingFaceProvider SHALL getProviderNameメソッドで「huggingface」を返却する

### 要件 8: OpenAI互換プロバイダー（Groq / OpenRouter）

**ユーザーストーリー:** 開発者として、Groq と OpenRouter のOpenAI互換APIを使用したLLMプロバイダーを利用したい。それにより、推論特化モデル（DeepSeek-R1系）との比較検証が可能になる。

#### 受け入れ基準

1. THE OpenAICompatibleProvider SHALL openaiパッケージを使用し、指定されたbaseURLでchatCompletionリクエストを実行する
2. WHEN プロバイダーがopenrouterの場合、THE OpenAICompatibleProvider SHALL HTTP-Refererヘッダーをリクエストに付与する
3. WHEN chatCompletionが呼び出された場合、THE OpenAICompatibleProvider SHALL メッセージ配列、maxTokens、temperatureパラメータをAPIに渡す
4. THE OpenAICompatibleProvider SHALL getProviderNameメソッドで設定されたプロバイダー名（「groq」または「openrouter」）を返却する

### 要件 9: 後方互換性

**ユーザーストーリー:** 開発者として、既存のHugging Face環境変数設定のみでアプリケーションが動作し続けることを保証したい。それにより、段階的な移行が可能になる。

#### 受け入れ基準

1. WHEN HUGGINGFACE_API_KEYのみが設定されている場合、THE LLMService SHALL 既存のHugging Faceプロバイダーを使用して動作する
2. WHEN LLMServiceのコンストラクタにapiKeyパラメータが明示的に渡された場合、THE LLMService SHALL 環境変数に関わらずHuggingFaceProviderを使用する
3. THE LLMService SHALL 既存のgenerateResponseメソッドのインターフェースを維持する
4. THE ChatResponse SHALL 既存のresponse、sources、error、errorCodeフィールドを維持する

### 要件 10: エラーハンドリング

**ユーザーストーリー:** ユーザーとして、エラーが発生した場合でも適切なメッセージを受け取りたい。それにより、次に何をすべきか理解できるようになる。

#### 受け入れ基準

1. IF LLMの出力がReActフォーマットに従わない場合、THEN THE ReasoningEngine SHALL 収集済みのコンテキストを使用してフォールバック回答を生成する
2. IF すべての検索イテレーションで関連結果が見つからない場合、THEN THE ReasoningEngine SHALL NO_RELEVANT_DATAエラーコードと共にレスポンスを返却する
3. IF 推論ループ全体がタイムアウトした場合、THEN THE ReasoningEngine SHALL 収集済み情報で部分的な回答を生成し、確信度を0.3以下に設定する
4. IF Hugging Face APIのレート制限に到達した場合、THEN THE ReasoningEngine SHALL 推論ループを即座に中断し、RATE_LIMIT_ERRORを返却する
5. IF LLMプロバイダーへの接続が失敗した場合、THEN THE ReasoningEngine SHALL プロバイダー固有のエラーメッセージを記録し、LLM_ERRORを返却する
6. IF LLM_PROVIDERに無効な値が設定されている場合、THEN THE LLMProviderFactory SHALL 明確なエラーメッセージで不足している設定を通知するエラーをスローする

### 要件 11: 推論過程の記録と制御

**ユーザーストーリー:** 開発者として、推論過程を記録・参照したい。それにより、AIの推論品質をデバッグ・改善できるようになる。

#### 受け入れ基準

1. THE ReasoningEngine SHALL 推論ループ中のコンテキストを単調増加（情報追加のみ）で管理する
2. WHEN 推論ステップが記録される場合、THE ReasoningEngine SHALL ステップ番号、タイプ（thought/action/observation）、内容、タイムスタンプを含める
3. WHEN デバッグモードが有効な場合、THE ChatResponse SHALL 推論ステップの情報を含める
4. WHILE デバッグモードが無効な場合、THE ChatResponse SHALL 推論ステップの情報をフロントエンドに返却しない

### 要件 12: 入力バリデーション

**ユーザーストーリー:** ユーザーとして、不正な入力に対して適切なエラーメッセージを受け取りたい。それにより、正しい形式で質問を入力できるようになる。

#### 受け入れ基準

1. WHEN 空のメッセージが送信された場合、THE チャットAPI SHALL VALIDATION_ERRORを返却する
2. WHEN 1000文字を超えるメッセージが送信された場合、THE チャットAPI SHALL VALIDATION_ERRORを返却する
3. WHEN 無効なリクエスト形式が送信された場合、THE チャットAPI SHALL VALIDATION_ERRORを返却する
