# FAQ データ更新手順書

このドキュメントでは、チャットボットの回答元データ（FAQデータ）を差し替える手順を説明します。

## 概要

このチャットボットは RAG（Retrieval-Augmented Generation）方式で動作しています。

```
ユーザーの質問
  ↓
① 質問をベクトル化（Hugging Face Embedding API）
  ↓
② embeddings.json 内のデータとコサイン類似度で検索
  ↓
③ 類似度の高いFAQをコンテキストとしてLLMに渡して回答生成
  ↓
回答を返す
```

データを差し替えるには、以下の3ステップが必要です。

---

## ステップ1: FAQデータの作成

`scripts/faq-data.json` を編集します。

### フォーマット

```json
[
  {
    "question": "質問文",
    "answer": "回答文",
    "category": "カテゴリ名"
  }
]
```

### ルール

- JSON配列で、各要素に `question`, `answer`, `category` の3フィールドが必須
- `question` と `answer` は結合されてベクトル化されるため、両方に十分な情報を含めること
- `category` は検索には使われないが、メタデータとして保存される
- 1件あたりのテキスト量は 500〜1500文字程度が目安（長すぎると検索精度が下がる）
- 20〜50件程度が推奨（多すぎるとベクトル化に時間がかかる）

### 例

```json
[
  {
    "question": "営業時間を教えてください",
    "answer": "営業時間は平日9:00〜18:00、土日祝は10:00〜17:00です。年末年始（12/29〜1/3）は休業です。",
    "category": "営業時間"
  },
  {
    "question": "駐車場はありますか？",
    "answer": "はい、50台分の無料駐車場がございます。満車の場合は近隣のコインパーキングをご利用ください。",
    "category": "アクセス"
  }
]
```

---

## ステップ2: ベクトル化の実行

### 前提条件

- `.env.local` に `HUGGINGFACE_API_KEY` が設定されていること
- `npm install` 済みであること

### 実行コマンド

```bash
npx tsx scripts/generate-embeddings.ts
```

### 処理内容

1. `scripts/faq-data.json` を読み込む
2. 各FAQの質問+回答を結合したテキストを Hugging Face API でベクトル化
3. `lib/data/embeddings.json` に出力

### 出力の確認

```
=== 完了 ===
出力: .../lib/data/embeddings.json
レコード数: 20
ベクトル次元数: 384
```

- レコード数がFAQデータの件数と一致していること
- ベクトル次元数が **384** であること（`paraphrase-multilingual-MiniLM-L12-v2` モデルの場合）

### トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `HUGGINGFACE_API_KEY が設定されていません` | 環境変数未設定 | `.env.local` を確認 |
| `429` エラー | APIレート制限 | スクリプトが自動リトライするので待つ |
| `faq-data.json の読み込みに失敗` | ファイルが存在しない or JSON不正 | ファイルパスとJSON構文を確認 |
| 次元数が384でない | 埋め込みモデルが異なる | `.env.local` の `HUGGINGFACE_EMBEDDING_MODEL` を確認 |

---

## ステップ3: UIの更新（必要に応じて）

FAQの対象を変更した場合、以下のファイルのテキストも更新してください。

### 更新対象ファイル

| ファイル | 更新箇所 |
|----------|----------|
| `app/layout.tsx` | `metadata` のタイトル・説明文 |
| `app/page.tsx` | `metadata` のタイトル・説明文・キーワード |
| `app/components/Header.tsx` | ヘッダーのタイトルテキスト |
| `app/components/ChatInterface.tsx` | チャットヘッダー、ウェルカムメッセージ、サンプル質問、注意書き |
| `lib/services/LLMService.ts` | LLMのシステムプロンプト（`role: "system"` の `content`） |

### サンプル質問の更新

`app/components/ChatInterface.tsx` 内の `sampleQuestions` 配列を、新しいFAQに合った質問に変更します。

```typescript
const sampleQuestions = [
  '新しい質問1',
  '新しい質問2',
  // ...
];
```

---

## ステップ4: 動作確認

```bash
npm run dev
```

以下を確認してください：

1. サンプル質問をクリックして回答が返ること
2. 回答がFAQデータの内容に基づいていること（LLMの一般知識ではなく）
3. FAQに含まれない質問をした場合に適切な応答が返ること

---

## 重要な注意事項

### 埋め込みモデルの統一

**ベクトル化時のモデルとランタイムのモデルは必ず同じにしてください。**

- ベクトル化スクリプト: `.env.local` の `HUGGINGFACE_EMBEDDING_MODEL` を使用
- ランタイム（チャットAPI）: 同じ `.env.local` の `HUGGINGFACE_EMBEDDING_MODEL` を使用

モデルが異なるとベクトルの次元数や意味空間が異なり、検索が正しく動作しません。

現在のデフォルト: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`（384次元・50言語対応）

### embeddings.json の構造

```json
[
  {
    "id": "uuid",
    "document": "Q: 質問文\nA: 回答文",
    "embedding": [0.01, -0.02, ...],  // 384次元の数値配列
    "metadata": {
      "category": "カテゴリ名",
      "question": "質問文"
    }
  }
]
```

- `document` フィールドにテキストが入っていること（空だと検索結果に表示されない）
- `embedding` の次元数がランタイムのモデルと一致していること

### デプロイ時

`lib/data/embeddings.json` はgitにコミットしてデプロイに含める必要があります。
Vercelのサーバーレス環境ではファイルシステムからこのJSONを読み込んで検索を行います。

---

## LLMモデルについて

### 現在のデフォルトモデル

`Qwen/Qwen2.5-7B-Instruct` — 日本語対応で、Hugging Face の無料 Inference API で利用可能。

### モデルが動かなくなった場合

Hugging Face の無料枠で利用可能なモデルは変更されることがあります。
エラーが出た場合は以下を確認してください：

1. [Hugging Face Inference Playground](https://huggingface.co/playground) でモデルが利用可能か確認
2. `.env.local` の `HUGGINGFACE_MODEL` を利用可能なモデルに変更
3. devサーバーを再起動

### 推奨モデル（2025年時点）

| モデル | 特徴 |
|--------|------|
| `Qwen/Qwen2.5-7B-Instruct` | 日本語対応、軽量、無料枠で利用可能 |
| `meta-llama/Llama-3.1-8B-Instruct` | 高品質、英語メイン |
| `deepseek-ai/DeepSeek-R1` | 推論能力が高い |

### 閾値（VECTOR_SEARCH_THRESHOLD）について

`paraphrase-multilingual-MiniLM-L12-v2` は多言語対応モデルのため、日本語テキスト同士でも比較的高い類似度スコアが出ます。
- 日本語FAQの場合: **0.3〜0.5** を推奨
- 英語FAQの場合: **0.6〜0.8** を推奨
