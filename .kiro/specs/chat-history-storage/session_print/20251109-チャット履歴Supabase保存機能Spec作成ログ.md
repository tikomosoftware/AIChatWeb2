# チャット履歴Supabase保存機能 Spec作成ログ

**日付**: 2025-11-09  
**時刻**: 23:41:59

---

## セッション概要

AIチャットボットシステムに、ユーザーとAIのやりとりをSupabaseデータベースに保存する機能を追加するためのSpec（仕様書）を作成しました。

---

## 作業内容

### 1. 初期要件のヒアリング

**ユーザーからの要望**:
- AIチャットのやりとりをSupabaseに登録して後で確認できるようにしたい

**初回提案内容**:
- 過去の会話セッション一覧の表示
- 特定の会話の詳細表示
- 新しい会話の開始
- 会話履歴の削除

### 2. 要件の絞り込み

**ユーザーからのフィードバック**:
以下の機能は不要で、シンプルに実装してほしい：
- 過去の会話セッション一覧の表示
- 特定の会話の詳細表示
- 新しい会話の開始
- 会話履歴の削除

**最終要件**:
- ユーザーからの質問と回答、時刻をセット（1レコード）で保存する
- データベースに保存するのみ（UI表示機能は含まない）

### 3. 作成したドキュメント

#### 3.1 要件定義書 (requirements.md)

**場所**: `.kiro/specs/chat-history-storage/requirements.md`

**主な要件**:

1. **要件1**: AIとのやりとりを自動的に保存
   - 質問と回答のペアを1レコードとして保存
   - 作成時刻を記録
   - 一意の識別子を割り当て
   - 保存失敗時もチャット機能は継続

2. **要件2**: Supabase接続の設定
   - 環境変数から接続情報を取得
   - 認証情報を安全に管理
   - 接続エラーはログに記録

3. **要件3**: エラーハンドリング
   - 履歴保存エラーがチャット機能に影響しない
   - エラーはログに記録のみ

#### 3.2 設計書 (design.md)

**場所**: `.kiro/specs/chat-history-storage/design.md`

**主な設計内容**:

1. **アーキテクチャ**:
   - 既存の `/api/chat` エンドポイントに統合
   - 非同期で履歴を保存（レスポンスを遅延させない）
   - エラー分離（履歴保存失敗がチャット機能に影響しない）

2. **データモデル**:
   ```sql
   CREATE TABLE chat_history (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     question text NOT NULL,
     answer text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   );
   ```

3. **新規サービス**: `ChatHistoryService`
   - Supabaseクライアントの初期化
   - `saveChat(question, answer)` メソッド
   - エラーハンドリング（ログのみ、throwしない）

4. **環境変数**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **セキュリティ**:
   - Row Level Security (RLS) ポリシーの設定
   - 匿名キーの使用（公開可能）

#### 3.3 実装タスクリスト (tasks.md)

**場所**: `.kiro/specs/chat-history-storage/tasks.md`

**タスク一覧**:

1. **タスク1**: Supabaseプロジェクトのセットアップとテーブル作成
   - プロジェクト作成と接続情報取得
   - `chat_history`テーブル作成
   - インデックスとRLSポリシー設定
   - 環境変数ファイルへの追加

2. **タスク2**: 依存パッケージのインストール
   - `@supabase/supabase-js` のインストール

3. **タスク3**: ChatHistoryServiceの実装
   - 型定義の作成 (`ChatHistoryRecord`)
   - サービスクラスの実装
   - エラーハンドリング

4. **タスク4**: API Routeへの統合
   - `/api/chat` に履歴保存ロジックを追加
   - 非同期実行とエラーキャッチ

5. **タスク5**: 動作確認とテスト
   - ローカル環境でのテスト
   - Supabaseダッシュボードでの確認
   - エラー時の動作確認

---

## 設計のポイント

### 非侵襲性
既存のチャット機能に影響を与えない設計：
- 履歴保存は非同期で実行
- エラーが発生してもチャット機能は継続
- `await` を使わず、Promise を返すのみ

### シンプル性
最小限の実装で要件を満たす：
- UI表示機能は含まない
- ユーザー認証は実装しない
- データベースに保存するのみ

### エラー分離
履歴機能のエラーがチャット機能に波及しない：
```typescript
try {
  const historyService = new ChatHistoryService();
  historyService.saveChat(userMessage, generatedResponse).catch(error => {
    console.error('Failed to save chat history:', error);
  });
} catch (error) {
  console.error('Failed to initialize chat history service:', error);
}
```

---

## 次のステップ

実装を開始するには：

1. `.kiro/specs/chat-history-storage/tasks.md` ファイルを開く
2. 各タスクの横にある「Start task」ボタンをクリック
3. タスクを順番に実行することを推奨

---

## 技術スタック

**既存**:
- Next.js 14 (App Router)
- TypeScript
- Hugging Face API
- Vercel (デプロイ)

**新規追加**:
- Supabase Client (`@supabase/supabase-js`)
- Supabase PostgreSQL

---

## 将来的な拡張案

現時点では実装しないが、将来的に追加可能な機能：

1. ユーザー認証（Supabase Auth）
2. 履歴表示UI
3. 検索機能
4. データ保持期間設定
5. 分析機能（よくある質問の分析）

---

## 承認状況

- ✅ 要件定義書: 承認済み
- ✅ 設計書: 承認済み
- ✅ 実装タスクリスト: 承認済み（MVPモード）

---

## 備考

- オプションタスクは「Keep optional tasks (faster MVP)」を選択
- テスト関連タスクは実装をスキップ可能
- 最小限の実装で動作する機能を優先

##
セッションログを作成しました。

ファイル名: 20251109-チャット履歴Supabase保存機能Spec作成ログ.md

このログには以下の内容が含まれています：

セッション概要
要件のヒアリングと絞り込みの経緯
作成した3つのドキュメント（要件定義書、設計書、タスクリスト）の詳細
設計のポイント（非侵襲性、シンプル性、エラー分離）
次のステップ
技術スタック
将来的な拡張案
実装を開始する際は、tasks.mdファイルを開いて各タスクを順番に実行してください。