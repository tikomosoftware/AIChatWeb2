# ワンダーランド東京 FAQ AIチャットボット（技術検証用）

RAG（Retrieval-Augmented Generation）技術を使用したFAQ AIチャットボット。架空のテーマパーク「ワンダーランド東京」のFAQ情報を学習データとして、来訪者の質問に自動で回答するシステムの技術検証プロジェクトです。

**注意:** 本プロジェクトは技術検証・学習目的のデモアプリケーションです。ワンダーランド東京は架空のテーマパークです。

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

**CHROMA_DB_PATH** (現在は未使用)
- 将来的な拡張のために定義を残していますが、現在は使用されていません
- 実際のベクトルデータは`lib/data/embeddings.json`から読み込まれます
- ChromaDB Cloudなどの外部サービスを使用する場合に備えて残しています

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

### 3. ベクトルデータの配置

**重要**: 本プロジェクトは`lib/data/embeddings.json`ファイルを使用してベクトル検索を行います。

#### ベクトルデータの要件

- `lib/data/embeddings.json`ファイルが必要です
- このファイルには、事前にベクトル化されたFAQデータが含まれています
- ファイルはgitにコミットされており、デプロイ時に自動的に含まれます

#### ChromaDBフォルダについて（参考情報）

プロジェクトルートに`chroma_db`フォルダが存在しますが、これは**参考用**です：
- ローカル開発時にChromaDBを使用していた名残です
- Vercelのサーバーレス環境ではChromaDBが動作しないため、現在は使用されていません
- `embeddings.json`ファイルは、このChromaDBデータからエクスポートされたものです
- 将来的にChromaDB Cloudなどの外部サービスを使用する場合の参考として残しています

#### データ更新方法

FAQデータを更新する場合：
1. `CreationOfChromeDBforAIReference`フォルダ内のスクリプトを参照
2. 新しいFAQデータをベクトル化
3. `lib/data/embeddings.json`ファイルを更新
4. 再デプロイ

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## 機能

- **AIチャット**: ワンダーランド東京に関する質問に自動で回答
- **音声入力**: マイクボタンから音声で質問を入力可能（Web Speech API使用）
- **サンプル質問**: 初回表示時に使いやすいサンプル質問を提示
- **ヘルプページ**: 技術スタック、使い方、データ作成方法の詳細説明
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップに対応

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # Reactコンポーネント
│   │   ├── Header.tsx     # ヘッダーコンポーネント
│   │   ├── Footer.tsx     # フッターコンポーネント
│   │   ├── ChatInterface.tsx  # チャットインターフェース
│   │   └── MessageInput.tsx   # メッセージ入力（音声入力対応）
│   ├── hooks/             # カスタムフック
│   │   └── useSpeechRecognition.ts  # 音声認識フック
│   ├── help/              # ヘルプページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ（チャット）
├── lib/                   # ユーティリティとサービス
├── chroma_db/            # ChromaDBデータベース（gitignore）
├── .env.local            # 環境変数（gitignore）
└── .env.example          # 環境変数のテンプレート
```

## 音声入力機能

### 対応ブラウザ

音声入力機能は、Web Speech APIをサポートするブラウザで利用可能です：

- **Chrome / Edge**: 完全対応（推奨）
- **Safari**: iOS 14.5以降、macOS Big Sur以降で対応
- **Firefox**: 現在非対応

### 使い方

1. メッセージ入力欄の横にあるマイクボタンをクリック
2. ブラウザがマイクへのアクセス許可を求めた場合は「許可」を選択
3. 音声で質問を話す
4. 話し終わったら自動的に認識が完了し、メッセージが送信されます
5. 途中で停止したい場合は、もう一度マイクボタンをクリック

### トラブルシューティング

**マイクが動作しない場合:**
- ブラウザのマイク使用許可を確認してください
- HTTPSまたはlocalhostでアクセスしているか確認してください（HTTPでは動作しません）
- マイクが正しく接続されているか確認してください

**音声が認識されない場合:**
- 静かな環境で話してください
- マイクに近づいて、はっきりと話してください
- 日本語で話していることを確認してください

## 開発

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルドを作成
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintでコードをチェック

## Vercelへのデプロイ

### 前提条件

- Vercelアカウント（[vercel.com](https://vercel.com)で無料登録）
- GitHubリポジトリにプロジェクトをプッシュ済み

### デプロイ前のチェックリスト

デプロイする前に、以下を確認してください：

- [ ] `lib/data/embeddings.json`ファイルが存在し、有効なデータが含まれている
- [ ] `embeddings.json`ファイルがgitにコミットされている
- [ ] ローカルで`npm run build`が成功する
- [ ] Hugging Face APIキーを取得済み
- [ ] `.env.local`ファイルで環境変数が正しく設定されている

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

**「データベースへの接続に失敗しました」エラーが表示される場合:**
1. `lib/data/embeddings.json`ファイルが存在するか確認
2. ファイルが有効なJSON形式で、データが含まれているか確認
3. ファイルがgitにコミットされ、デプロイに含まれているか確認
4. デプロイ後、`https://your-app.vercel.app/api/health`にアクセスして診断情報を確認
5. Vercelの関数ログで詳細なエラーメッセージを確認（Dashboard → Project → Logs）
6. ローカルで`npm run build`を実行してビルドエラーがないか確認

**診断エンドポイントの使用方法:**
- デプロイ後、`/api/health`エンドポイントにアクセスすると、以下の情報が表示されます：
  - 環境変数の設定状況
  - `embeddings.json`ファイルの存在と場所
  - ファイルサイズとレコード数
  - エラーメッセージ（ある場合）

**ビルドエラーが発生する場合:**
- ローカルで`npm run build`を実行してエラーを確認
- 環境変数が正しく設定されているか確認
- `lib/data/embeddings.json`ファイルが存在するか確認

**APIエラーが発生する場合:**
- Hugging Face APIキーが正しく設定されているか確認
- Vercelの環境変数設定を確認（Dashboard → Project → Settings → Environment Variables）
- Vercelの関数ログを確認（Dashboard → Project → Logs）

**タイムアウトエラーが発生する場合:**
- Vercel Pro以上のプランでは、関数の最大実行時間を延長可能
- `vercel.json`の`maxDuration`設定を確認
- `REQUEST_TIMEOUT`環境変数を調整

### データベースについて

#### 現在の実装方式

このプロジェクトは、**埋め込みデータ方式**を使用しています：
- ベクトルデータは`lib/data/embeddings.json`ファイルに保存されています
- 追加のデータベースサーバーは不要です
- データ更新時は`embeddings.json`を更新して再デプロイが必要です

**重要な注意事項:**
- `lib/data/embeddings.json`ファイルが存在し、有効なデータが含まれていることを確認してください
- ファイルサイズが大きい場合（>50MB）、Vercelのデプロイ制限に注意してください
- データが空の場合、「データベースへの接続に失敗しました」というエラーが表示されます

#### ChromaDBについて（参考情報）

当初はChromaDBを使用する予定でしたが、Vercelのサーバーレス環境では動作しないことが判明しました：
- ChromaDBはSQLiteベースのため、サーバーレス関数では使用できません
- そのため、ChromaDBデータを`embeddings.json`にエクスポートして使用しています
- `chroma_db`フォルダは参考として残されていますが、本番環境では使用されていません

#### 将来的にデータ量が増加した場合

以下のオプションを検討してください：
1. **ChromaDB Cloud**: [chroma.com](https://www.trychroma.com/)でクラウドインスタンスを作成
2. **Pinecone**: 専用のベクトルデータベースサービス
3. **Supabase Vector**: PostgreSQLベースのベクトル検索
4. **分割デプロイ**: 複数の`embeddings.json`ファイルに分割

## データソース

本プロジェクトのFAQデータはAIによって生成された架空の情報です。ワンダーランド東京は実在しないテーマパークです。

## ライセンス

MIT
