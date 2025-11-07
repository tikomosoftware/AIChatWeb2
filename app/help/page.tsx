import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ヘルプ - 明治村FAQ AIチャットボット',
  description: '明治村FAQ AIチャットボットの使い方と技術情報',
};

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
          {/* タイトル */}
          <div className="border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              明治村FAQ AIチャットボット
            </h1>
            <p className="text-sm text-red-600 font-medium">
              ※ 本サイトは技術検証用のデモアプリケーションです
            </p>
          </div>

          {/* 概要 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">概要</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              このアプリケーションは、RAG（Retrieval-Augmented Generation）技術を使用したAIチャットボットの技術検証プロジェクトです。
              博物館明治村様の公式サイトに掲載されている
              <a 
                href="https://www.meijimura.com/guide/beginner/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline mx-1"
              >
                FAQ情報
              </a>
              を学習データとして使用し、来訪者の質問に自動で回答するシステムを実装しています。
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>重要:</strong> 本サイトは博物館明治村様の公式サイトではありません。
                FAQデータは技術検証・学習目的で使用させていただいております。
                正確な情報は必ず
                <a 
                  href="https://www.meijimura.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline mx-1"
                >
                  公式サイト
                </a>
                でご確認ください。
              </p>
            </div>
          </section>

          {/* 使い方 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">使い方</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>チャット画面で明治村に関する質問を入力してください</li>
              <li>AIが関連するFAQ情報を検索し、回答を生成します</li>
              <li>回答が不十分な場合は、質問を言い換えて再度お試しください</li>
            </ol>
          </section>

          {/* サンプル質問 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">サンプル質問</h2>
            <p className="text-gray-700 mb-4">以下のような質問をお試しください：</p>
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💬</span>
                <p className="text-gray-800">「明治村の見どころは何ですか？」</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💬</span>
                <p className="text-gray-800">「入村チケットについて教えてください」</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💬</span>
                <p className="text-gray-800">「開村時間を教えてください」</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💬</span>
                <p className="text-gray-800">「駐車場はありますか？」</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💬</span>
                <p className="text-gray-800">「ペットを連れて入れますか？」</p>
              </div>
            </div>
          </section>

          {/* 技術スタック */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">技術スタック</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">フロントエンド</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• React 18</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">バックエンド</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Next.js API Routes</li>
                  <li>• Vercel (デプロイ)</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">AI・機械学習</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Hugging Face Inference API</li>
                  <li>• Mistral-7B-Instruct (LLM)</li>
                  <li>• Sentence Transformers (埋め込み)</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">データベース</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• ChromaDB (ベクトルDB)</li>
                  <li>• JSON形式の埋め込みデータ</li>
                </ul>
              </div>
            </div>
          </section>

          {/* RAG技術について */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">RAG技術について</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              RAG（Retrieval-Augmented Generation）は、大規模言語モデル（LLM）の回答精度を向上させる技術です。
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">1. 埋め込み生成</h4>
                <p className="text-sm text-gray-700">
                  FAQデータをベクトル化し、ChromaDBに保存
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">2. 類似検索</h4>
                <p className="text-sm text-gray-700">
                  ユーザーの質問に関連する情報をベクトル検索で取得
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">3. 回答生成</h4>
                <p className="text-sm text-gray-700">
                  検索結果を元にLLMが自然な回答を生成
                </p>
              </div>
            </div>
          </section>

          {/* データ作成方法 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">データ作成方法</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>明治村公式サイトのFAQページからデータを収集</li>
              <li>質問と回答のペアをJSON形式で構造化</li>
              <li>Sentence Transformersで各テキストをベクトル化</li>
              <li>ChromaDBにベクトルデータを保存</li>
              <li>検証用にJSON形式でエクスポート</li>
            </ol>
          </section>

          {/* 謝辞 */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">謝辞</h2>
            <p className="text-gray-700 leading-relaxed">
              本プロジェクトは、博物館明治村様の公式サイトに掲載されているFAQ情報を技術検証・学習目的で使用させていただいております。
              貴重な情報を公開していただいている博物館明治村様に深く感謝申し上げます。
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              本サイトは非公式のデモアプリケーションであり、商用利用は行っておりません。
              もし問題がございましたら、速やかに対応させていただきますので、ご連絡ください。
            </p>
          </section>

          {/* リンク */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">関連リンク</h2>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.meijimura.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  博物館明治村 公式サイト
                </a>
              </li>
              <li>
                <a 
                  href="https://www.meijimura.com/guide/beginner/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  明治村FAQ（データ提供元）
                </a>
              </li>
            </ul>
          </section>
        </div>

          {/* チャットに戻るボタン */}
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              チャットを試す
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
