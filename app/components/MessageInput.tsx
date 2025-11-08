'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useSpeechRecognition } from '@/app/hooks/useSpeechRecognition';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const {
    transcript,
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      resetTranscript();
    }
  };

  // 音声認識の結果をテキストエリアに反映
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // 音声認識が停止したら自動的に送信
  useEffect(() => {
    if (!isListening && transcript) {
      handleSend();
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* 音声認識エラーメッセージ */}
      {speechError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {speechError}
        </div>
      )}

      {/* 音声認識中のインジケーター */}
      {isListening && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-4 bg-blue-500 animate-pulse" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-4 bg-blue-500 animate-pulse" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span>音声を認識中...</span>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          disabled={disabled || isListening}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
        />
        
        {/* 音声入力ボタン */}
        {isSupported && (
          <button
            onClick={handleVoiceInput}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            title={isListening ? '音声入力を停止' : '音声入力を開始'}
          >
            {isListening ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </div>

      {/* 音声入力が非対応の場合のメッセージ */}
      {!isSupported && (
        <div className="mt-2 text-xs text-gray-500">
          お使いのブラウザは音声入力に対応していません。Chrome、Edge、Safariをお試しください。
        </div>
      )}
    </div>
  );
}
