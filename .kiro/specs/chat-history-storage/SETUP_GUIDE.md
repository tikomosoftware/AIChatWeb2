# Supabaseセットアップガイド

このガイドでは、チャット履歴保存機能のためのSupabaseプロジェクトのセットアップ手順を説明します。

## 前提条件

- Supabaseアカウント（無料）
- インターネット接続

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスし、ログインまたはサインアップします
2. ダッシュボードで「New Project」をクリックします
3. 以下の情報を入力します：
   - **Name**: `chat-history` （任意の名前）
   - **Database Password**: 強力なパスワードを設定（保存しておいてください）　※83YzWE43?Y#KkJf
   - **Region**: 最寄りのリージョンを選択（例: Northeast Asia (Tokyo)）
   - **Pricing Plan**: Free（無料プラン）
4. 「Create new project」をクリックします
5. プロジェクトの作成が完了するまで1-2分待ちます

### 2. 接続情報の取得

1. プロジェクトダッシュボードで「Settings」（歯車アイコン）をクリックします
2. 左メニューから「API」を選択します
3. 以下の情報をコピーします：
   - **Project URL**: `https://xxxxx.supabase.co` の形式　※DataAPI - API Setting https://dahoiryopcxrykmbpisj.supabase.co
   - **anon public key**: `eyJhbGc...` で始まる長い文字列　※eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaG9pcnlvcGN4cnlrbWJwaXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDI0ODUsImV4cCI6MjA3ODE3ODQ4NX0.-w-39VKe9wlSlHpwAo0hHzGhO35ERVvj7kXZygMLFts

### 3. データベーステーブルの作成

1. プロジェクトダッシュボードで「SQL Editor」をクリックします
2. 「New Query」をクリックします
3. `supabase-setup.sql` ファイルの内容をコピーして貼り付けます
4. 「Run」ボタンをクリックしてSQLを実行します
5. 「Success. No rows returned」というメッセージが表示されれば成功です

### 4. 環境変数の設定

1. プロジェクトルートの `.env.local` ファイルを開きます
2. 以下の値を、手順2で取得した情報に置き換えます：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（取得したanon public key）
```

3. ファイルを保存します

### 5. セットアップの確認

1. Supabaseダッシュボードで「Table Editor」をクリックします
2. 左側のテーブル一覧に `chat_history` が表示されていることを確認します
3. テーブルをクリックして、以下のカラムが存在することを確認します：
   - `id` (uuid)
   - `question` (text)
   - `answer` (text)
   - `created_at` (timestamptz)

## トラブルシューティング

### SQLエラーが発生する場合

- SQLファイルの内容を全てコピーしているか確認してください
- 既にテーブルが存在する場合は、`DROP TABLE chat_history CASCADE;` を実行してから再度作成してください

### 環境変数が認識されない場合

- `.env.local` ファイルが正しい場所（プロジェクトルート）にあるか確認してください
- Next.jsの開発サーバーを再起動してください（`npm run dev` を停止して再実行）
- 環境変数名が `NEXT_PUBLIC_` で始まっているか確認してください

### RLSポリシーエラーが発生する場合

- Supabaseダッシュボードで「Authentication」>「Policies」から `chat_history` テーブルのポリシーを確認してください
- 必要に応じて、SQL Editorから `supabase-setup.sql` を再実行してください

## 次のステップ

セットアップが完了したら、次のタスクに進んでください：
- タスク2: 依存パッケージのインストール
- タスク3: ChatHistoryServiceの実装

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
