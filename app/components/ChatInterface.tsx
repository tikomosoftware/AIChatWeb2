'use client';

import { useState } from 'react';
import { Message, ChatState, ChatRequest, ChatResponse } from '@/lib/types/chat';
import { ErrorCode } from '@/lib/types/errors';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ErrorMessage from './ErrorMessage';

interface ExtendedChatState extends ChatState {
  errorCode?: ErrorCode;
}

export default function ChatInterface() {
  const [chatState, setChatState] = useState<ExtendedChatState>({
    messages: [],
    isLoading: false,
    error: null,
    errorCode: undefined,
  });

  const handleSendMessage = async (content: string) => {
    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      errorCode: undefined,
    }));

    try {
      const request: ChatRequest = { message: content };
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ChatResponse = await response.json();

      // Handle NO_RELEVANT_DATA as a special case - show as message, not error
      if (data.errorCode === ErrorCode.NO_RELEVANT_DATA) {
        const noDataMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, noDataMessage],
          isLoading: false,
        }));
        return;
      }

      if (!response.ok || data.error) {
        // Extract error code if present
        const errorMessage = data.error || 'エラーが発生しました';
        const error = new Error(errorMessage) as Error & { code?: ErrorCode };
        error.code = data.errorCode;
        throw error;
      }

      // AIの応答を追加
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      const errorCode = (error as Error & { code?: ErrorCode })?.code;
      
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        errorCode: errorCode,
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">AI チャットボット</h1>
        <p className="text-sm text-blue-100">RAGベースの質問応答システム</p>
      </div>

      {/* メッセージリスト */}
      <MessageList messages={chatState.messages} />

      {/* ローディングインジケーター */}
      {chatState.isLoading && (
        <div className="px-4 py-2 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>回答を生成中...</span>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      <ErrorMessage 
        error={chatState.error} 
        code={chatState.errorCode}
        onDismiss={() => setChatState(prev => ({ ...prev, error: null, errorCode: undefined }))}
      />

      {/* 入力フォーム */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={chatState.isLoading}
      />
    </div>
  );
}
