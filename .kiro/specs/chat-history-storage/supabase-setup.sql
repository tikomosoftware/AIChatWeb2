-- ============================================
-- Chat History Storage - Supabase Setup
-- ============================================
-- このSQLファイルをSupabaseのSQL Editorで実行してください
-- 実行方法: Supabaseダッシュボード > SQL Editor > New Query

-- ============================================
-- 1. テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. インデックス作成
-- ============================================
-- 作成日時での検索パフォーマンス向上のため
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at 
ON chat_history(created_at DESC);

-- ============================================
-- 3. Row Level Security (RLS) の有効化
-- ============================================
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS ポリシー設定
-- ============================================
-- 全ユーザーが挿入可能（匿名ユーザー含む）
CREATE POLICY "Enable insert for all users" ON chat_history
  FOR INSERT
  WITH CHECK (true);

-- 読み取りは無効化（管理者のみがダッシュボードで閲覧可能）
CREATE POLICY "Disable read for public" ON chat_history
  FOR SELECT
  USING (false);

-- 更新と削除は無効化
CREATE POLICY "Disable update for all" ON chat_history
  FOR UPDATE
  USING (false);

CREATE POLICY "Disable delete for all" ON chat_history
  FOR DELETE
  USING (false);

-- ============================================
-- 5. 確認クエリ（オプション）
-- ============================================
-- テーブルが正しく作成されたか確認
-- SELECT * FROM chat_history LIMIT 10;

-- インデックスが作成されたか確認
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chat_history';

-- RLSポリシーが設定されたか確認
-- SELECT * FROM pg_policies WHERE tablename = 'chat_history';
