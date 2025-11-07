import ChatInterface from './components/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chatbot - RAG',
  description: 'RAGベースのAIチャットボット - Hugging FaceとChromaDBを使用した質問応答システム',
  keywords: ['AI', 'Chatbot', 'RAG', 'Hugging Face', 'ChromaDB'],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* レスポンシブコンテナ */}
      <div className="container mx-auto h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-full py-4 sm:py-6 lg:py-8">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
