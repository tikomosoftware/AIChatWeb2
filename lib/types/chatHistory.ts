/**
 * Chat History Type Definitions
 * 
 * チャット履歴の型定義
 */

/**
 * Chat History Record
 * 
 * Supabaseに保存されるチャット履歴レコードの型定義
 */
export interface ChatHistoryRecord {
  /** レコードの一意識別子 (UUID) */
  id?: string;
  
  /** ユーザーからの質問 */
  question: string;
  
  /** AIが生成した回答 */
  answer: string;
  
  /** レコード作成日時 (ISO 8601形式) */
  created_at?: string;
}
