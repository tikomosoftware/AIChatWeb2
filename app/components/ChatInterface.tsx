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

  const sampleQuestions = [
    'ワンダーランド東京の営業時間を教えてください',
    '入場チケットの料金はいくらですか？',
    '人気のアトラクションは何ですか？',
    '園内で食事はできますか？',
    'ペットを連れて入場できますか？',
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-4 rounded-t-lg shadow-md">
        <h1 className="text-xl font-bold">ワンダーランド東京 FAQ AIチャットボット</h1>
        <p className="text-sm text-teal-100">ReAct推論でワンダーランド東京に関する質問にお答えします</p>
      </div>

      {/* メッセージリストまたはウェルカムメッセージ */}
      {chatState.messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ようこそ！
              </h2>
              <p className="text-gray-600">
                ワンダーランド東京に関する質問をお気軽にどうぞ
              </p>
            </div>

            <div className="bg-teal-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-teal-600 mr-2">💡</span>
                サンプル質問
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                以下のような質問をお試しください：
              </p>
              <div className="space-y-2">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    disabled={chatState.isLoading}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-gray-700">{question}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> このチャットボットは技術検証用のデモです。
                ワンダーランド東京は架空のテーマパークです。
              </p>
            </div>
          </div>
        </div>
      ) : (
        <MessageList messages={chatState.messages} />
      )}

      {/* ローディングインジケーター */}
      {chatState.isLoading && (
        <div className="px-4 py-2 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full"></div>
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
