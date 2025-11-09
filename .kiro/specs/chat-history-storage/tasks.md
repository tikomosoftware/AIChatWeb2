# 実装計画

- [x] 1. Supabaseプロジェクトのセットアップとテーブル作成





  - Supabaseプロジェクトを作成し、接続情報を取得する
  - `chat_history`テーブルをSQLで作成する
  - インデックスとRLSポリシーを設定する
  - 環境変数ファイル（`.env.local`と`.env.example`）にSupabase設定を追加する
  - _要件: 2.1, 2.2, 2.3_

- [x] 2. 依存パッケージのインストール





  - `@supabase/supabase-js`パッケージをインストールする
  - `package.json`が正しく更新されることを確認する
  - _要件: 2.1_

- [x] 3. ChatHistoryServiceの実装




  - [x] 3.1 型定義とインターフェースの作成


    - `lib/types/chatHistory.ts`に`ChatHistoryRecord`型を定義する
    - _要件: 1.1, 1.3_
  
  - [x] 3.2 ChatHistoryServiceクラスの実装


    - `lib/services/ChatHistoryService.ts`を作成する
    - Supabaseクライアントの初期化ロジックを実装する
    - `saveChat`メソッドを実装する（質問と回答を保存）
    - エラーハンドリングを実装する（ログ出力のみ、throwしない）
    - _要件: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 4. API Routeへの統合





  - `/api/chat`の`POST`ハンドラーに履歴保存ロジックを追加する
  - LLMレスポンス生成後に`ChatHistoryService.saveChat`を呼び出す
  - 非同期で実行し、エラーをキャッチしてログ出力する
  - 既存のレスポンス返却ロジックに影響を与えないことを確認する
  - _要件: 1.1, 1.4, 3.1, 3.2, 3.3_

- [x] 5. 動作確認とテスト





  - ローカル環境でチャット機能を実行する
  - Supabaseダッシュボードでレコードが保存されることを確認する
  - 履歴保存エラー時にチャット機能が継続することを確認する（環境変数を無効化してテスト）
  - _要件: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3_
