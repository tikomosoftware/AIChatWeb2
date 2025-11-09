# Execute Task 7.3 Vercelデプロイ設定 - デプロイ後のトラブルシューティング作業ログ

## セッション概要
- **日付**: 2025年11月7日
- **タスク**: Vercelデプロイ後のエラー解決とトラブルシューティング
- **初期状態**: デプロイ済みだが「データベースへの接続に失敗しました」エラーが発生
- **最終状態**: 正常に動作するチャットボットの完成

---

## 作業ログ

### 1. 初期問題の報告
**ユーザー指示**: デプロイして実行してみました。データベースへの接続に失敗しました。と表示します

**Kiroの対応**:
- 関連ファイルを確認（`EmbeddedVectorSearchService.ts`, `route.ts`, `.env.example`, `chroma_db/README.md`）
- 問題の特定: `embeddings.json`ファイルのインポート方法に問題がある可能性

**実施した修正**:
1. `EmbeddedVectorSearchService.ts`を修正
   - 静的インポートから動的ファイル読み込みに変更
   - 複数の可能なパスを試行してファイルを探す仕組みを追加
   - `document`フィールドが空の場合、`metadata['chroma:document']`からテキストを取得
   - 初期化状態を追跡する`initialized`フラグを追加

2. `chat/route.ts`を修正
   - より詳細なエラーログを追加

3. `next.config.js`を修正
   - JSONファイルが正しく処理されるようにwebpack設定を更新

4. 診断エンドポイント`app/api/health/route.ts`を新規作成
   - 環境変数の設定状況を確認
   - `embeddings.json`ファイルの存在と場所を確認
   - ファイルサイズとレコード数を表示

5. `README.md`を更新
   - デプロイ前のチェックリストを追加
   - トラブルシューティングセクションを拡充

6. `DEPLOYMENT_FIX.md`を新規作成
   - 修正内容の詳細なドキュメント

---

### 2. 環境変数の確認
**ユーザー指示**: readme.mdを確認しました。オプションの環境変数　←これって事前に設定必要ですか

**Kiroの回答**:
- オプションの環境変数は**事前設定不要**
- 必須なのは`HUGGINGFACE_API_KEY`のみ
- その他はすべてデフォルト値が設定されている

---

### 3. 新しいエラーの発生
**ユーザー報告**: ブラウザコンソールに500エラーが表示される

**Kiroの対応**:
- `/api/health`エンドポイントでの診断を依頼

**診断結果**:
```json
{
  "hasHuggingfaceApiKey": false,
  "embeddingsJson": {
    "exists": true,
    "recordCount": 19,
    "isValidArray": true
  }
}
```

**問題**: `HUGGINGFACE_API_KEY`が設定されていない

**解決策の提示**:
1. Vercel Dashboardで環境変数を設定
2. 再デプロイが必要

---

### 4. Hugging Face APIエンドポイントエラー
**ユーザー報告**: Vercelログに以下のエラー
```
"https://api-inference.huggingface.co is no longer supported. 
Please use https://router.huggingface.co/hf-inference instead."
```

**Kiroの対応**:
- `@huggingface/inference`パッケージを最新版にアップデート
- `npm install @huggingface/inference@latest`
- バージョン: v2.7.0 → v4.13.2

**実施した作業**:
```bash
npm install @huggingface/inference@latest
npm run build
git add package.json package-lock.json
git commit -m "Fix: Hugging Face APIエンドポイントの更新"
```

---

### 5. ベクトル次元数の不一致エラー
**ユーザー報告**: Vercelログに以下のエラー
```
Vector search failed: Error: Vectors must have the same length
```

**Kiroの分析**:
- クエリのembeddingベクトルと保存されているベクトルの次元数が異なる
- `embeddings.json`を作成した時のモデルと現在使用しているモデルが異なる

**診断情報の追加**:
1. `EmbeddedVectorSearchService.ts`にログ追加
   - 保存されているembeddingの次元数を表示
2. `chat/route.ts`にログ追加
   - クエリembeddingの次元数を表示
   - 使用中のモデル名を表示

**ユーザー報告**: 
```
Stored embedding dimensions: 1024
Query embedding dimensions: 384
```

**問題の特定**:
- 保存データ: 1024次元
- クエリ: 384次元（デフォルトの`sentence-transformers/all-MiniLM-L6-v2`）

**解決策の試行**:
1. 環境変数`HUGGINGFACE_EMBEDDING_MODEL`を`intfloat/e5-large-v2`に設定
2. 再デプロイ

**結果**: まだ384次元のまま

**原因の発見**:
- `vercel.json`に古い値が記述されていた
- `vercel.json`の`env`セクションがVercel Dashboardの環境変数より優先される

**最終的な修正**:
```json
"HUGGINGFACE_EMBEDDING_MODEL": "intfloat/multilingual-e5-large"
```

**ユーザーからの情報**: embeddings.jsonの作成スクリプト
```python
embeddings = SentenceTransformerEmbeddings(
    model_name="intfloat/multilingual-e5-large"
)
```

**確認**: 正しいモデルは`intfloat/multilingual-e5-large`

---

### 6. 環境変数の反映確認
**ユーザー質問**: Environments　は Allになってます

**Kiroの回答**: 
- "All"は正しい設定
- 重要なのは**再デプロイ**すること

**ユーザー**: 再デプロイもしました

**Kiroの発見**: `vercel.json`に問題があった
```json
"HUGGINGFACE_EMBEDDING_MODEL": "sentence-transformers/all-MiniLM-L6-v2"
```

**修正**: `vercel.json`を`intfloat/multilingual-e5-large`に変更

**結果**: 
```
Using embedding model: intfloat/multilingual-e5-large
Query embedding dimensions: 1024
All scores (top 5): 0.901, 0.834, 0.803, 0.790, 0.788
Search returned 3 results above threshold 0.7
```

✅ ベクトル検索が正常に動作！

---

### 7. LLM回答生成エラー
**ユーザー報告**: 「回答の生成中にエラーが発生しました。」と表示

**Vercelログ**:
```
Search returned 3 results above threshold 0.7
Top 3 scores: 0.901, 0.834, 0.803
```

**問題**: 検索は成功しているが、LLMの回答生成で失敗

**試行1**: `google/flan-t5-large`に変更
**結果**: `No Inference Provider available for model google/flan-t5-large`

**試行2**: `microsoft/Phi-3-mini-4k-instruct`に変更
**結果**: `No Inference Provider available for model microsoft/Phi-3-mini-4k-instruct`

**試行3**: `HuggingFaceH4/zephyr-7b-beta`に変更
**結果**: 
```
Model HuggingFaceH4/zephyr-7b-beta is not supported for task text-generation 
and provider featherless-ai. Supported task: conversational.
```

**問題の分析**: 
- `textGeneration` APIではなく`chatCompletion` APIが必要
- 多くのモデルがHugging Face Inference APIの無料枠で利用できない

**最終的な解決策**:
1. `LLMService.ts`を修正
   - `textGeneration` → `chatCompletion` APIに変更
   - メッセージ形式に変更（system + user）

2. モデルを`meta-llama/Meta-Llama-3-8B-Instruct`に変更

**実施した修正**:
```typescript
// Before
const apiPromise = this.client.textGeneration({
  model: this.modelName,
  inputs: prompt,
  parameters: { ... }
});

// After
const apiPromise = this.client.chatCompletion({
  model: this.modelName,
  messages: [
    { role: "system", content: "..." },
    { role: "user", content: "..." }
  ],
  max_tokens: ...,
  temperature: ...
});
```

**コミット**:
```bash
git add lib/services/LLMService.ts vercel.json
git commit -m "Fix: chatCompletion APIに変更、Llama-3モデルを使用"
git push
```

---

### 8. 成功！
**ユーザー報告**: OKです

**最終構成**:
- **Embeddingモデル**: `intfloat/multilingual-e5-large` (1024次元)
- **LLMモデル**: `meta-llama/Meta-Llama-3-8B-Instruct`
- **API**: `chatCompletion`
- **検索スコア**: 0.8以上の高精度
- **データ**: 明治村に関する19ドキュメント

---

## 解決した問題の一覧

1. ✅ **Hugging Face APIエンドポイントの更新**
   - 旧エンドポイントが廃止されていた
   - パッケージを v4.13.2 にアップデート

2. ✅ **embeddings.jsonの読み込み**
   - 静的インポートが動作しない
   - 動的ファイル読み込みに変更
   - 複数パスを試行する仕組みを追加

3. ✅ **データ構造の問題**
   - `document`フィールドが空
   - `metadata['chroma:document']`からテキストを取得

4. ✅ **環境変数の設定**
   - `HUGGINGFACE_API_KEY`が未設定
   - Vercel Dashboardで設定

5. ✅ **ベクトル次元数の不一致**
   - 保存データ: 1024次元
   - クエリ: 384次元
   - 正しいモデル`intfloat/multilingual-e5-large`を使用

6. ✅ **vercel.jsonの設定**
   - 古いモデル名が記述されていた
   - 正しいモデル名に更新

7. ✅ **LLM APIの変更**
   - `textGeneration`が多くのモデルで利用不可
   - `chatCompletion` APIに変更

8. ✅ **動作するモデルの選定**
   - 複数のモデルを試行
   - `meta-llama/Meta-Llama-3-8B-Instruct`で成功

---

## 作成・修正したファイル

### 新規作成
1. `app/api/health/route.ts` - 診断エンドポイント
2. `DEPLOYMENT_FIX.md` - 修正内容のドキュメント

### 修正
1. `lib/services/EmbeddedVectorSearchService.ts`
   - 動的ファイル読み込み
   - データ構造の対応
   - デバッグログ追加

2. `app/api/chat/route.ts`
   - エラーログの詳細化
   - デバッグ情報の追加

3. `lib/services/LLMService.ts`
   - `textGeneration` → `chatCompletion`
   - メッセージ形式に変更

4. `next.config.js`
   - JSONファイルの処理設定

5. `vercel.json`
   - Embeddingモデルの設定
   - LLMモデルの設定
   - タイムアウトの延長

6. `package.json`
   - `@huggingface/inference` v4.13.2にアップデート

7. `README.md`
   - デプロイ前チェックリスト追加
   - トラブルシューティング拡充

---

## 学んだこと

1. **Vercelのサーバーレス環境**
   - 静的インポートが動作しない場合がある
   - 動的ファイル読み込みが必要

2. **環境変数の優先順位**
   - `vercel.json`の`env`セクションが優先される
   - Vercel Dashboardの設定だけでは不十分な場合がある

3. **Hugging Face Inference API**
   - 無料枠で利用できるモデルが限られている
   - `textGeneration`より`chatCompletion`の方が多くのモデルをサポート
   - APIエンドポイントが変更されることがある

4. **ベクトル検索**
   - Embeddingモデルは作成時と検索時で完全に一致させる必要がある
   - 同じ次元数でも異なるモデルでは類似度が低くなる

5. **デバッグの重要性**
   - 診断エンドポイントが非常に有用
   - ログに次元数やモデル名を出力することで問題を特定しやすい

---

## 最終的なコミット履歴

1. `Fix: データベース接続エラーを修正`
2. `Fix: Hugging Face APIエンドポイントの更新 - @huggingface/inference を v4.13.2 にアップデート`
3. `Debug: ベクトル次元数をログに出力`
4. `Fix: vercel.jsonのembeddingモデルをintfloat/e5-large-v2に変更`
5. `Fix: vercel.jsonのembeddingモデルをintfloat/multilingual-e5-largeに変更`
6. `Fix: 正しいembeddingモデル intfloat/multilingual-e5-large を使用`
7. `Fix: 類似度閾値を0.5に下げ、デバッグログを追加`
8. `Debug: 使用中のembeddingモデル名をログに出力`
9. `Fix: LLMモデルをgoogle/flan-t5-largeに変更、タイムアウトを60秒に延長`
10. `Fix: LLMモデルをmicrosoft/Phi-3-mini-4k-instructに変更`
11. `Fix: LLMモデルをHuggingFaceH4/zephyr-7b-betaに変更`
12. `Fix: LLMモデルをmistralai/Mixtral-8x7B-Instruct-v0.1に変更`
13. `Fix: chatCompletion APIに変更、Llama-3モデルを使用`

---

## 最終指示

**ユーザー指示**: このセッションのすべて作業ログを日本語にしてmdファイルに書き出してください。自分の指示とKiroの動作を再確認したいです。作業ログのファイル名にはExecute Task:X.Xから始まるセッション名を先頭に含めてください。また、この指示を含めたログにしてください。

**Kiroの対応**: 本ファイルを作成

---

## まとめ

約2時間にわたるトラブルシューティングセッションで、以下を達成しました：

- ✅ デプロイ後のすべてのエラーを解決
- ✅ 正常に動作するRAGチャットボットの完成
- ✅ 高精度な検索（スコア0.8以上）
- ✅ 適切なLLMモデルの選定
- ✅ 包括的なドキュメント作成

最も重要な学びは、**段階的なデバッグとログの重要性**でした。各ステップで問題を特定し、一つずつ解決していくアプローチが成功につながりました。

##
作業ログを作成しました！

ファイル名: Execute Task 7.3 Vercelデプロイ設定 - デプロイ後のトラブルシューティング作業ログ.md

このログには以下が含まれています：

セッション全体の流れ
各問題の詳細と解決策
実施したコマンドとコード変更
学んだこと
最終的なコミット履歴
この指示も含めた完全なログ
約2時間のトラブルシューティングセッションで13回のコミットを経て、最終的に正常に動作するチャットボットを完成させました！🎉