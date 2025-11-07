# デプロイエラー修正ガイド

## 問題の概要

デプロイ後に「データベースへの接続に失敗しました」というエラーが表示される問題を修正しました。

## 原因

1. **JSONファイルの読み込み方法**: 静的インポートではなく、ファイルシステムから動的に読み込む必要がありました
2. **データ構造の問題**: `embeddings.json`の`document`フィールドが空で、実際のテキストは`metadata['chroma:document']`に格納されていました
3. **初期化チェックの不足**: サービスが正しく初期化されているか確認する仕組みが不十分でした

## 実施した修正

### 1. EmbeddedVectorSearchService.ts の修正

**変更内容:**
- 静的インポートから動的ファイル読み込みに変更
- 複数の可能なパスを試行してファイルを探す
- `document`フィールドが空の場合、`metadata['chroma:document']`からテキストを取得
- 初期化状態を追跡する`initialized`フラグを追加
- 空のドキュメントをフィルタリング

**修正箇所:**
```typescript
// Before: 静的インポート
import embeddingsData from '../data/embeddings.json';

// After: 動的読み込み
import { promises as fs } from 'fs';
import path from 'path';

async initialize(): Promise<void> {
  // 複数のパスを試行
  const possiblePaths = [
    path.join(process.cwd(), 'lib', 'data', 'embeddings.json'),
    path.join(process.cwd(), '.next', 'server', 'lib', 'data', 'embeddings.json'),
    path.join(__dirname, '..', 'data', 'embeddings.json'),
  ];
  
  // ファイルを読み込んでパース
  const fileContent = await fs.readFile(filePath, 'utf-8');
  this.data = JSON.parse(fileContent);
}

// ドキュメントテキストの取得を修正
const documentText = item.document || item.metadata['chroma:document'] || '';
```

### 2. chat/route.ts の修正

**変更内容:**
- より詳細なエラーログを追加
- エラーメッセージにより多くの情報を含める

### 3. next.config.js の修正

**変更内容:**
- JSONファイルが正しく処理されるようにwebpack設定を更新

### 4. 診断エンドポイントの追加

**新規ファイル:** `app/api/health/route.ts`

このエンドポイントは以下の情報を提供します：
- 環境変数の設定状況
- `embeddings.json`ファイルの存在と場所
- ファイルサイズとレコード数
- パースエラー（ある場合）

**使用方法:**
```
https://your-app.vercel.app/api/health
```

### 5. README.md の更新

- デプロイ前のチェックリストを追加
- トラブルシューティングセクションを拡充
- 診断エンドポイントの使用方法を追加

## デプロイ手順

1. **変更をコミット:**
   ```bash
   git add .
   git commit -m "Fix: データベース接続エラーを修正"
   git push
   ```

2. **Vercelで自動デプロイ:**
   - GitHubにプッシュすると自動的にデプロイが開始されます

3. **デプロイ後の確認:**
   - `/api/health`エンドポイントにアクセスして診断情報を確認
   - チャット機能が正常に動作するかテスト

## トラブルシューティング

### エラーが継続する場合

1. **診断エンドポイントを確認:**
   ```
   https://your-app.vercel.app/api/health
   ```
   
   確認項目:
   - `files.embeddingsJson.exists`: `true`であること
   - `files.embeddingsJson.recordCount`: 0より大きいこと
   - `files.embeddingsJson.isValidArray`: `true`であること

2. **Vercelログを確認:**
   - Vercel Dashboard → Project → Logs
   - エラーメッセージの詳細を確認

3. **環境変数を確認:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - `HUGGINGFACE_API_KEY`が正しく設定されているか確認

4. **ローカルでビルドテスト:**
   ```bash
   npm run build
   npm run start
   ```
   
   ローカルで動作する場合、デプロイ環境固有の問題です。

### よくある問題

**問題:** `embeddings.json`ファイルが見つからない
**解決策:** ファイルがgitにコミットされているか確認

**問題:** ファイルは存在するがデータが空
**解決策:** `embeddings.json`の内容を確認し、有効なJSON配列であることを確認

**問題:** メモリ不足エラー
**解決策:** `vercel.json`の`memory`設定を増やす（現在1024MB）

## 今後の改善案

1. **データ量が増加した場合:**
   - ChromaDB Cloudへの移行を検討
   - データを複数のファイルに分割

2. **パフォーマンス改善:**
   - エッジキャッシングの活用
   - 検索結果のキャッシング

3. **監視とログ:**
   - エラー追跡サービス（Sentry等）の導入
   - パフォーマンスモニタリング

## 参考情報

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
