# 要件定義書

## はじめに

このドキュメントは、RAG（Retrieval-Augmented Generation）ベースのAIチャットボットシステムの要件を定義します。このシステムは、事前にベクトル化されたFAQデータ（JSONファイル）からコサイン類似度で関連情報を検索し、Hugging Faceの言語モデルを使用してユーザーの質問に回答します。Vercelにデプロイ可能なWebアプリケーションとして実装されます。

## 実装経緯

### 当初の設計（ChromaDB使用）
当初はChromaDBをベクトルデータベースとして使用する予定でした。ローカル開発環境では正常に動作していましたが、Vercelのサーバーレス環境ではChromaDB（SQLiteベース）が動作しないことが判明しました。

### 最終的な実装方式
ChromaDBの代わりに、JSONファイルベースのインメモリベクトル検索方式を採用しました：
1. `generate-embeddings.ts` でFAQデータをHugging Face APIでベクトル化し、`embeddings.json` に保存
2. 実行時は `EmbeddedVectorSearchService` がJSONファイルをメモリに読み込み
3. ユーザーの質問をHugging Faceでベクトル化して、コサイン類似度で検索
4. 検索結果をLLMに渡して回答を生成

## 用語集

- **RAG Chatbot System**: ベクトル検索と生成AIを組み合わせたチャットボットシステム全体
- **User**: チャットボットと対話するエンドユーザー
- **embeddings.json**: 事前にベクトル化されたFAQデータを格納したJSONファイル
- **EmbeddedVectorSearchService**: JSONファイルをメモリに読み込み、コサイン類似度で検索を行うカスタムサービス
- **Embedding Model**: Hugging Faceの多言語対応埋め込みモデル（paraphrase-multilingual-MiniLM-L12-v2）
- **LLM Service**: Hugging Faceの無料枠で提供される大規模言語モデル（Qwen2.5-7B-Instruct）
- **Query**: ユーザーからの質問または入力テキスト
- **Retrieved Context**: コサイン類似度検索によって取得された関連ドキュメント
- **Response**: LLMが生成したユーザーへの回答

## 要件

### 要件 1

**ユーザーストーリー:** ユーザーとして、質問を入力してベクトル検索から関連情報に基づいた回答を受け取りたい。これにより、事前に準備されたFAQデータに基づく正確な情報を得ることができる。

#### 受入基準

1. WHEN User がクエリを入力して送信する, THE RAG Chatbot System SHALL そのクエリをHugging Face Embedding APIでベクトル化する
2. WHEN クエリがベクトル化される, THE RAG Chatbot System SHALL embeddings.json のデータとコサイン類似度で関連ドキュメントを検索する
3. WHEN 関連ドキュメントが取得される, THE RAG Chatbot System SHALL Retrieved Context と Query を LLM Service に送信する
4. WHEN LLM Service が応答を生成する, THE RAG Chatbot System SHALL その Response をユーザーに表示する
5. WHILE クエリが処理中である, THE RAG Chatbot System SHALL ローディングインジケーターを表示する

### 要件 2

**ユーザーストーリー:** ユーザーとして、FAQデータに関連情報が存在しない場合に適切な通知を受け取りたい。これにより、質問の範囲外であることを理解できる。

#### 受入基準

1. WHEN コサイン類似度検索で関連ドキュメントが見つからない, THE RAG Chatbot System SHALL その旨をユーザーに通知する
2. WHEN 類似度スコアが閾値を下回る, THE RAG Chatbot System SHALL データに該当情報がない旨のメッセージを表示する
3. THE RAG Chatbot System SHALL データ範囲外の質問に対して誤った情報を生成しない

### 要件 3

**ユーザーストーリー:** ユーザーとして、事前にベクトル化されたFAQデータを使用したい。これにより、Vercelサーバーレス環境でも高速にベクトル検索が行える。

#### 受入基準

1. THE RAG Chatbot System SHALL lib/data/embeddings.json ファイルからベクトルデータを読み込む
2. THE RAG Chatbot System SHALL Hugging Face の多言語対応埋め込みモデル（paraphrase-multilingual-MiniLM-L12-v2）を使用する
3. WHEN システムが起動する, THE RAG Chatbot System SHALL EmbeddedVectorSearchService を初期化してベクトルデータをメモリに読み込む
4. IF embeddings.json の読み込みが失敗する, THEN THE RAG Chatbot System SHALL エラーメッセージを表示する

#### 補足：当初の設計（ChromaDB）について
当初はChromaDBをベクトルデータベースとして使用する予定でしたが、Vercelのサーバーレス環境ではChromaDB（SQLiteベース）が動作しないため、JSONファイルベースのインメモリベクトル検索方式に変更しました。`chroma_db` フォルダは参考として残されていますが、本番環境では使用されていません。

### 要件 4

**ユーザーストーリー:** ユーザーとして、Hugging Faceの無料枠を使用してコストを抑えたい。これにより、無料で運用可能なシステムを構築できる。

#### 受入基準

1. THE RAG Chatbot System SHALL Hugging Face の無料 API を使用して Embedding生成 と LLM推論 にアクセスする
2. THE RAG Chatbot System SHALL API レート制限内で動作する
3. WHEN API レート制限に達する, THE RAG Chatbot System SHALL 適切なエラーメッセージをユーザーに表示する
4. THE RAG Chatbot System SHALL Hugging Face API キーを環境変数で安全に管理する

### 要件 5

**ユーザーストーリー:** ユーザーとして、Vercelにデプロイされたアプリケーションを使用したい。これにより、簡単にアクセス可能なWebアプリケーションを利用できる。

#### 受入基準

1. THE RAG Chatbot System SHALL Vercel プラットフォームにデプロイ可能な構成である
2. THE RAG Chatbot System SHALL サーバーレス関数として動作する
3. THE RAG Chatbot System SHALL 環境変数を通じて API キーと設定を管理する
4. WHEN ユーザーがアプリケーションにアクセスする, THE RAG Chatbot System SHALL 5秒以内に初期画面を表示する

### 要件 6

**ユーザーストーリー:** ユーザーとして、使いやすいインターフェースでチャットボットを操作したい。これにより、スムーズな対話体験を得ることができる。

#### 受入基準

1. THE RAG Chatbot System SHALL レスポンシブなユーザーインターフェースを提供する
2. THE RAG Chatbot System SHALL クエリ入力フィールドと送信ボタンを提供する
3. WHEN User が Enter キーを押す, THE RAG Chatbot System SHALL クエリを送信する
4. THE RAG Chatbot System SHALL 会話履歴を時系列順に表示する
5. THE RAG Chatbot System SHALL ユーザークエリと AI Response を視覚的に区別する

### 要件 7

**ユーザーストーリー:** ユーザーとして、エラーが発生した場合に適切な通知を受け取りたい。これにより、問題を理解し適切に対応できる。

#### 受入基準

1. IF LLM Service への接続が失敗する, THEN THE RAG Chatbot System SHALL エラーメッセージをユーザーに表示する
2. IF ベクトル検索が失敗する, THEN THE RAG Chatbot System SHALL エラーメッセージをユーザーに表示する
3. THE RAG Chatbot System SHALL エラーメッセージを日本語で明確に表示する
4. IF クエリ処理が30秒を超える, THEN THE RAG Chatbot System SHALL タイムアウトメッセージを表示する
