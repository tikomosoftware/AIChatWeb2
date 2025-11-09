# 本番環境でのチャット履歴保存エラーの修正方法

## 問題
本番環境（Vercel）でSupabaseの環境変数が設定されていないため、チャット履歴がDBに保存されない。

エラーメッセージ：
```
[ChatHistoryService] Error in constructor: Supabase configuration is missing
[ChatHistoryService] Error in saveChat: Supabase client is not initialized
```

## 原因
`.env.local`ファイルはローカル開発環境でのみ使用され、本番環境（Vercel等）には自動的に反映されません。

## 解決手順

### 1. Vercelダッシュボードで環境変数を設定

1. Vercelダッシュボードにアクセス: https://vercel.com/dashboard
2. プロジェクトを選択
3. **Settings** タブをクリック
4. 左メニューから **Environment Variables** を選択
5. 以下の環境変数を追加：

#### 追加する環境変数

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://.......supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ.....` | Production, Preview, Development |

**重要**: 
- 両方の環境変数を **Production**, **Preview**, **Development** すべての環境に追加してください
- `NEXT_PUBLIC_` プレフィックスは必須です（クライアントサイドでも使用可能にするため）

### 2. 再デプロイ

環境変数を追加した後、プロジェクトを再デプロイする必要があります：

#### 方法A: Vercelダッシュボードから
1. **Deployments** タブに移動
2. 最新のデプロイメントの右側にある **...** メニューをクリック
3. **Redeploy** を選択

#### 方法B: Gitプッシュで自動デプロイ
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

### 3. 動作確認

再デプロイ完了後：

1. 本番環境のURLにアクセス
2. チャット機能を使用してメッセージを送信
3. Supabaseダッシュボードで `chat_history` テーブルを確認
4. 新しいレコードが追加されていることを確認

## 環境変数の確認方法

### Vercel CLIを使用する場合
```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# ログイン
vercel login

# 環境変数を確認
vercel env ls
```

### ダッシュボードで確認
1. Vercel Dashboard > Project > Settings > Environment Variables
2. 設定した環境変数が表示されているか確認

## トラブルシューティング

### 環境変数を追加したのにまだエラーが出る場合

1. **再デプロイを実行したか確認**
   - 環境変数の追加だけでは反映されません
   - 必ず再デプロイが必要です

2. **環境変数名が正確か確認**
   - `NEXT_PUBLIC_SUPABASE_URL` （スペルミスに注意）
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - プレフィックス `NEXT_PUBLIC_` は必須

3. **すべての環境に追加したか確認**
   - Production
   - Preview
   - Development

4. **ビルドログを確認**
   - Vercel Dashboard > Deployments > 最新のデプロイ > Build Logs
   - エラーメッセージがないか確認

5. **ランタイムログを確認**
   - Vercel Dashboard > Deployments > 最新のデプロイ > Functions
   - `/api/chat` のログを確認
   - `[ChatHistoryService] Error` が出ていないか確認

### それでも解決しない場合

環境変数が正しく読み込まれているか確認するため、一時的にログを追加：

```typescript
// app/api/chat/route.ts の履歴保存部分に追加
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

再デプロイ後、ログを確認して環境変数が読み込まれているか確認してください。

## セキュリティに関する注意

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` は公開可能な匿名キーです
- このキーはクライアントサイドでも使用されるため、公開されても問題ありません
- Supabase側でRow Level Security (RLS) ポリシーが設定されているため、安全です
- より機密性の高い操作には、サービスロールキーを使用してください（環境変数名に `NEXT_PUBLIC_` を付けない）

## 参考リンク

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Client Libraries](https://supabase.com/docs/reference/javascript/installing)
