# セッション: HUGGINGFACE_MODEL確認

**日時:** 2025年11月18日（火）

---

## Q1: HUGGINGFACE_MODELは何を使っていますか

### 回答

このプロジェクトでは、**HUGGINGFACE_MODEL**として以下のモデルを使用しています：

**デフォルト設定:**
- コード内のデフォルト: `mistralai/Mistral-7B-Instruct-v0.2`

**Vercelデプロイ用の設定:**
- `vercel.json`で指定: `meta-llama/Meta-Llama-3-8B-Instruct`

つまり、ローカル環境では**Mistral-7B**、Vercelデプロイ環境では**Llama-3-8B**を使用する設定になっています。

どちらも日本語に対応したインストラクションチューニング済みのモデルで、Hugging Faceの無料枠で利用可能です。

### 検索結果の詳細

**lib/services/LLMService.ts:**
```typescript
this.modelName = modelName || process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
```

**vercel.json:**
```json
"env": {
  "HUGGINGFACE_MODEL": "meta-llama/Meta-Llama-3-8B-Instruct",
  "HUGGINGFACE_EMBEDDING_MODEL": "intfloat/multilingual-e5-large",
  "VECTOR_SEARCH_TOP_K": "3",
}
```

**.env.example:**
```
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

---

## Q2: 以下の２つはどちらが優秀ですか
- meta-llama/Llama-3.2-3B-Instruct
- meta-llama/Meta-Llama-3-8B-Instruct

### 回答

**Meta-Llama-3-8B-Instruct** の方が優秀です。

主な理由：

**パラメータ数の違い**
- Llama-3.2-3B: 30億パラメータ
- Llama-3-8B: 80億パラメータ

**性能面**
- 8Bモデルの方が複雑な推論、長文理解、文脈把握が優れています
- より正確で詳細な回答を生成できます
- 日本語を含む多言語対応も8Bの方が安定しています

**3.2-3Bモデルの利点**
- レスポンスが速い
- メモリ使用量が少ない
- モバイルやエッジデバイス向け

**チャットボット用途では**
現在使用している**Meta-Llama-3-8B-Instruct**が適切です。回答品質を重視するなら8Bを維持することをおすすめします。

ただし、レスポンス速度を最優先したい場合や、Hugging Faceの無料枠でレート制限に引っかかる場合は、3.2-3Bに切り替えるのも選択肢です。

---

## まとめ

- 現在のプロジェクトはVercelデプロイ時に`Meta-Llama-3-8B-Instruct`を使用
- ローカル環境のデフォルトは`Mistral-7B-Instruct-v0.2`
- 8Bモデルは3Bモデルより性能が高く、チャットボット用途に適している
