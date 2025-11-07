# AI Chatbot - RAG

RAG（Retrieval-Augmented Generation）ベースのAIチャットボットシステム。ChromaDBベクトルデータベースから関連情報を検索し、Hugging Faceの言語モデルを使用してユーザーの質問に回答します。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes (サーバーレス関数)
- **ベクトルデータベース**: ChromaDB
- **埋め込みモデル**: Hugging Face Embeddings (sentence-transformers)
- **LLM**: Hugging Face Inference API (無料枠)
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`ファイルを`.env.local`にコピーし、必要なAPIキーを設定してください：

```bash
cp .env.example .env.local
```

#### 必須の環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `HUGGINGFACE_API_KEY` | Hugging Face APIキー | [Hugging Face Settings](https://huggingface.co/settings/tokens)から無料で取得可能 |

#### オプションの環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|--------------|
| `HUGGINGFACE_MODEL` | 使用するLLMモデル | `mistralai/Mistral-7B-Instruct-v0.2` |
| `HUGGINGFACE_EMBEDDING_MODEL` | 使用する埋め込みモデル | `sentence-transformers/all-MiniLM-L6-v2` |
| `CHROMA_DB_PATH` | ChromaDBデータベースのパス | `./chroma_db` |
| `VECTOR_SEARCH_TOP_K` | ベクトル検索で取得する上位K件 | `3` |
| `VECTOR_SEARCH_THRESHOLD` | 類似度スコアの閾値（0.0-1.0） | `0.7` |
| `REQUEST_TIMEOUT` | APIリクエストのタイムアウト（ミリ秒） | `30000` |

#### 環境変数の詳細説明

**HUGGINGFACE_API_KEY** (必須)
- Hugging Faceの無料APIキーを使用します
- [こちら](https://huggingface.co/settings/tokens)からアカウントを作成し、トークンを生成してください
- 無料枠でも十分に動作します

**HUGGINGFACE_MODEL**
- 回答生成に使用するLLMモデルを指定します
- 推奨モデル: `mistralai/Mistral-7B-Instruct-v0.2`（日本語対応）
- その他の選択肢: `meta-llama/Llama-2-7b-chat-hf`, `google/flan-t5-large`

**HUGGINGFACE_EMBEDDING_MODEL**
- テキストのベクトル化に使用するモデルを指定します
- 推奨モデル: `sentence-transformers/all-MiniLM-L6-v2`（軽量で高速）
- その他の選択肢: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`（多言語対応）

**CHROMA_DB_PATH**
- ChromaDBデータベースフォルダのパスを指定します
- プロジェクトルートからの相対パスまたは絶対パスを指定可能
- 既存のChromaDBデータベースを使用する場合は、そのパスを指定してください

**VECTOR_SEARCH_TOP_K**
- ベクトル検索で取得する関連ドキュメントの数を指定します
- 値が大きいほど多くのコンテキストを取得しますが、処理時間が増加します
- 推奨値: 3-5

**VECTOR_SEARCH_THRESHOLD**
- 類似度スコアの閾値を指定します（0.0-1.0の範囲）
- この値以下のスコアのドキュメントは除外されます
- 値が高いほど厳密なマッチングになります
- 推奨値: 0.6-0.8

**REQUEST_TIMEOUT**
- APIリクエストのタイムアウト時間をミリ秒で指定します
- Hugging Faceの無料枠では応答に時間がかかる場合があります
- 推奨値: 30000（30秒）

### 3. ChromaDBデータベースの配置

既存のChromaDBデータベース（`chroma_db`フォルダ）をプロジェクトルートに配置してください。

#### ChromaDBデータベースの要件

- プロジェクトルートに`chroma_db`フォルダが必要です
- 既存のChromaDBデータベースを使用する場合は、そのフォルダをコピーしてください
- データベースは読み取り専用モードで使用されます

#### .gitignoreの設定について

デフォルトでは、`.gitignore`ファイルで`chroma_db/`がコメントアウトされています。

**ローカル開発のみの場合:**
- `.gitignore`の`# chroma_db/`行のコメントを外して、データベースをgit管理から除外できます

**Vercelにデプロイする場合:**
- `chroma_db`フォルダをgitにコミットする必要があります（コメントアウトのまま）
- データベースサイズが大きい場合は、外部のChromaDBサーバーを使用することを検討してください

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # Reactコンポーネント
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── lib/                   # ユーティリティとサービス
├── chroma_db/            # ChromaDBデータベース（gitignore）
├── .env.local            # 環境変数（gitignore）
└── .env.example          # 環境変数のテンプレート
```

## 開発

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルドを作成
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintでコードをチェック

## Vercelへのデプロイ

### 前提条件

- Vercelアカウント（[vercel.com](https://vercel.com)で無料登録）
- GitHubリポジトリにプロジェクトをプッシュ済み

### デプロイ手順

1. **Vercelにログイン**
   - [vercel.com](https://vercel.com)にアクセスしてログイン

2. **新しいプロジェクトをインポート**
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択してインポート

3. **環境変数を設定**
   - 「Environment Variables」セクションで以下を設定:
   
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```
   
   オプション（デフォルト値を変更する場合）:
   ```
   HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
   HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
   VECTOR_SEARCH_TOP_K=3
   VECTOR_SEARCH_THRESHOLD=0.7
   REQUEST_TIMEOUT=30000
   ```

4. **デプロイ**
   - 「Deploy」ボタンをクリック
   - ビルドが完了するまで待機（通常2-3分）

5. **デプロイ完了**
   - デプロイが成功すると、URLが発行されます
   - URLにアクセスしてチャットボットを使用できます

### デプロイ後の確認事項

- チャットインターフェースが正しく表示されるか
- メッセージを送信して回答が返ってくるか
- エラーメッセージが適切に表示されるか

### トラブルシューティング

**ビルドエラーが発生する場合:**
- ローカルで`npm run build`を実行してエラーを確認
- 環境変数が正しく設定されているか確認

**APIエラーが発生する場合:**
- Hugging Face APIキーが正しく設定されているか確認
- Vercelの関数ログを確認（Dashboard → Project → Logs）

**タイムアウトエラーが発生する場合:**
- Vercel Pro以上のプランでは、関数の最大実行時間を延長可能
- `vercel.json`の`maxDuration`設定を確認

### データベースについて

このプロジェクトは、埋め込みデータ方式を使用しています:
- ChromaDBのデータはビルド時にJSONファイルとして埋め込まれます
- 追加のデータベースサーバーは不要です
- データ更新時は再デプロイが必要です

**将来的にデータ量が増加した場合:**
- ChromaDB Cloudへの移行を検討してください
- [chroma.com](https://www.trychroma.com/)でクラウドインスタンスを作成
- 環境変数でChromaDB CloudのURLを設定

## ライセンス

MIT
