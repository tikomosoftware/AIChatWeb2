import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Footer from './components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ワンダーランド東京 FAQ AIチャットボット - 技術検証用',
  description: 'RAG技術を使用したFAQ AIチャットボット。ワンダーランド東京のFAQ情報を元に質問に回答します。',
  keywords: ['ワンダーランド東京', 'AI', 'Chatbot', 'RAG', 'FAQ', '技術検証'],
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
