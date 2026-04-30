import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Footer from './components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ワンダーランド東京 FAQ AIチャットボット - 探索ベースAI',
  description: 'ReAct推論パターンに基づく探索ベースAIチャットボット。ワンダーランド東京のFAQ情報を元に多段階推論で質問に回答します。',
  keywords: ['ワンダーランド東京', 'AI', 'Chatbot', 'ReAct', 'RAG', 'FAQ', '探索ベースAI'],
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="container mx-auto flex-1 flex flex-col max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <ChatInterface />
        </div>
      </main>
      <Footer />
    </div>
  );
}
