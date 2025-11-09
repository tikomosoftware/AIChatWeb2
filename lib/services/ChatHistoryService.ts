import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ChatHistoryRecord } from '../types/chatHistory';

/**
 * Chat History Service
 * 
 * チャット履歴をSupabaseデータベースに保存するサービス
 * エラーが発生してもチャット機能に影響を与えないように設計されています
 */
export class ChatHistoryService {
  private supabase: SupabaseClient | null = null;

  /**
   * コンストラクタ
   * Supabaseクライアントを初期化します
   */
  constructor() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        this.handleError(
          new Error('Supabase configuration is missing'),
          'constructor'
        );
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      this.handleError(error, 'constructor');
    }
  }

  /**
   * チャット履歴を保存
   * 
   * @param question - ユーザーからの質問
   * @param answer - AIが生成した回答
   * @returns Promise<void> - エラーが発生してもthrowしません
   */
  async saveChat(question: string, answer: string): Promise<void> {
    // Supabaseクライアントが初期化されていない場合は何もしない
    if (!this.supabase) {
      this.handleError(
        new Error('Supabase client is not initialized'),
        'saveChat'
      );
      return;
    }

    try {
      const record: ChatHistoryRecord = {
        question,
        answer,
      };

      const { error } = await this.supabase
        .from('chat_history')
        .insert(record);

      if (error) {
        throw error;
      }
    } catch (error) {
      this.handleError(error, 'saveChat');
    }
  }

  /**
   * エラーハンドリング
   * エラーをコンソールにログ出力します（throwしません）
   * 
   * @param error - エラーオブジェクト
   * @param context - エラーが発生したコンテキスト
   */
  private handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ChatHistoryService] Error in ${context}:`, errorMessage);
    
    // デバッグ用に詳細情報も出力
    if (error instanceof Error && error.stack) {
      console.error(`[ChatHistoryService] Stack trace:`, error.stack);
    }
  }
}
