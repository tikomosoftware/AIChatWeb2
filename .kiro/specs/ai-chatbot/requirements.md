# 要件定義書

## はじめに

このドキュメントは、RAG（Retrieval-Augmented Generation）ベースのAIチャットボットシステムの要件を定義します。このシステムは、事前にベクトル化されたデータベース（Chroma）から関連情報を検索し、Hugging Faceの言語モデルを使用してユーザーの質問に回答します。Vercelにデプロイ可能なWebアプリケーションとして実装されます。

## 用語集

- **RAG Chatbot System**: ベクトル検索と生成AIを組み合わせたチャットボットシステム全体
- **User**: チャットボットと対話するエンドユーザー
- **Vector Database**: ChromaDBに格納された、事前にベクトル化されたテキストデータ
- **Embedding Model**: Hugging Faceを使用したテキストのベクトル化モデル
- **LLM Service**: Hugging Faceの無料枠で提供される大規模言語モデル
- **Query**: ユーザーからの質問または入力テキスト
- **Retrieved Context**: ベクトル検索によって取得された関連ドキュメント
- **Response**: LLMが生成したユーザーへの回答

## 要件

### 要件 1

**ユーザーストーリー:** ユーザーとして、質問を入力してベクトルデータベースから関連情報に基づいた回答を受け取りたい。これにより、事前に準備されたデータに基づく正確な情報を得ることができる。

#### 受入基準

1. WHEN User がクエリを入力して送信する, THE RAG Chatbot System SHALL そのクエリをベクトル化する
2. WHEN クエリがベクトル化される, THE RAG Chatbot System SHALL Vector Database から関連ドキュメントを検索する
3. WHEN 関連ドキュメントが取得される, THE RAG Chatbot System SHALL Retrieved Context と Query を LLM Service に送信する
4. WHEN LLM Service が応答を生成する, THE RAG Chatbot System SHALL その Response をユーザーに表示する
5. WHILE クエリが処理中である, THE RAG Chatbot System SHALL ローディングインジケーターを表示する

### 要件 2

**ユーザーストーリー:** ユーザーとして、データベースに関連情報が存在しない場合に適切な通知を受け取りたい。これにより、質問の範囲外であることを理解できる。

#### 受入基準

1. WHEN Vector Database から関連ドキュメントが見つからない, THE RAG Chatbot System SHALL その旨をユーザーに通知する
2. WHEN 類似度スコアが閾値を下回る, THE RAG Chatbot System SHALL データに該当情報がない旨のメッセージを表示する
3. THE RAG Chatbot System SHALL データ範囲外の質問に対して誤った情報を生成しない

### 要件 3

**ユーザーストーリー:** ユーザーとして、既存のChromaDBデータベースを使用したい。これにより、事前に準備されたベクトルデータを活用できる。

#### 受入基準

1. THE RAG Chatbot System SHALL chroma_db フォルダ内の既存 Vector Database に接続する
2. THE RAG Chatbot System SHALL Hugging Face の埋め込みモデルを使用する
3. WHEN システムが起動する, THE RAG Chatbot System SHALL Vector Database の接続を確立する
4. IF Vector Database への接続が失敗する, THEN THE RAG Chatbot System SHALL エラーメッセージを表示する

### 要件 4

**ユーザーストーリー:** ユーザーとして、Hugging Faceの無料枠を使用してコストを抑えたい。これにより、無料で運用可能なシステムを構築できる。

#### 受入基準

1. THE RAG Chatbot System SHALL Hugging Face の無料 API を使用して LLM Service にアクセスする
2. THE RAG Chatbot System SHALL API レート制限内で動作する
3. WHEN API レート制限に達する, THE RAG Chatbot System SHALL 適切なエラーメッセージをユーザーに表示する
4. THE RAG Chatbot System SHALL Hugging Face API キーを安全に管理する

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
2. IF Vector Database へのクエリが失敗する, THEN THE RAG Chatbot System SHALL エラーメッセージをユーザーに表示する
3. THE RAG Chatbot System SHALL エラーメッセージを日本語で明確に表示する
4. IF クエリ処理が30秒を超える, THEN THE RAG Chatbot System SHALL タイムアウトメッセージを表示する
