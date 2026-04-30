import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Metadata } from 'next';
import faqData from '../../scripts/faq-data.json';

export const metadata: Metadata = {
  title: 'ヘルプ - ワンダーランド東京 FAQ AIチャットボット',
  description: 'ワンダーランド東京 FAQ AIチャットボットの使い方と技術情報',
};

export default function HelpPage() {
  // カテゴリごとにグループ化
  const categories = [...new Set(faqData.map(faq => faq.category))];

  // 現在の設定値（環境変数から動的に取得）
  const currentConfig = {
    llmProvider: process.env.LLM_PROVIDER || 'huggingface',
    llmModel: process.env.LLM_MODEL || process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    topK: process.env.VECTOR_SEARCH_TOP_K || '3',
    threshold: process.env.VECTOR_SEARCH_THRESHOLD || '0.3',
    timeout: process.env.REQUEST_TIMEOUT || '30000',
    debugMode: process.env.DEBUG_MODE === 'true' || process.env.DEBUG_MODE === '1' ? 'ON' : 'OFF',
  };

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
              ワンダーランド東京 FAQ AIチャットボット
            </h1>
            <p className="text-sm text-red-600 font-medium">
              ※ 本サイトは技術検証用のデモアプリケーションです。ワンダーランド東京は架空のテーマパークです。
            </p>
          </div>

          {/* 概要 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">概要</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              このアプリケーションは、ReAct（Reasoning + Acting）パターンに基づく多段階推論AIチャットボットの技術検証プロジェクトです。
              架空のテーマパーク「ワンダーランド東京」のFAQデータを学習データとして使用し、
              来訪者の質問に対して段階的に情報を収集・推論して正確な回答を生成します。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              従来の単純なRAG（Retrieval-Augmented Generation）方式から進化し、
              AIが「質問分析→検索→結果評価→再検索」のサイクルを繰り返すことで、
              複雑な質問や複数の情報を組み合わせる質問にも対応できます。
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>重要:</strong> ワンダーランド東京は架空の施設です。
                本サイトはReAct推論技術のデモンストレーションを目的としています。
              </p>
            </div>
          </section>

          {/* 使い方 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">使い方</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>チャット画面でワンダーランド東京に関する質問を入力してください</li>
              <li>AIが関連するFAQ情報を検索し、回答を生成します</li>
              <li>回答が不十分な場合は、質問を言い換えて再度お試しください</li>
            </ol>

            <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                <span className="mr-2">🎤</span>
                音声入力機能
              </h3>
              <p className="text-sm text-green-800 mb-3">
                マイクボタンをクリックして、音声で質問を入力できます。
              </p>
              <div className="space-y-2 text-sm text-green-800">
                <div>
                  <strong>対応ブラウザ:</strong> Chrome、Edge、Safari（iOS 14.5以降）
                </div>
                <div className="text-xs text-green-700 mt-2">
                  ※ HTTPSまたはlocalhostでのみ動作します
                </div>
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
                  <li>• React 18 / TypeScript</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">AI・推論エンジン</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• ReAct推論パターン（多段階推論）</li>
                  <li>• Hugging Face Inference API</li>
                  <li>• Groq API（OpenAI互換）</li>
                  <li>• OpenRouter API（OpenAI互換）</li>
                </ul>
              </div>
            </div>

            {/* 現在の設定値（環境変数から動的に取得） */}
            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">⚙️ 現在の設定</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">LLMプロバイダー:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.llmProvider}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">LLMモデル:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.llmModel}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">埋め込みモデル:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.embeddingModel}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">検索上位K件:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.topK}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">類似度閾値:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.threshold}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">タイムアウト:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.timeout}ms
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">デバッグモード:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {currentConfig.debugMode}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">FAQデータ件数:</span>
                  <code className="ml-2 bg-white px-2 py-0.5 rounded border text-blue-700">
                    {faqData.length}件
                  </code>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                ※ これらの値は .env.local の設定から取得しています。変更するにはサーバー再起動が必要です。
              </p>
            </div>
          </section>

          {/* ReAct推論技術について */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ReAct推論技術について</h2>
            <p className="text-sm text-gray-700 mb-4">
              本アプリケーションは、従来のRAG（検索→回答生成）を発展させた
              ReAct（Reasoning + Acting）パターンを採用しています。
              AIが「考える→行動する→観察する」のサイクルを繰り返すことで、
              より正確な回答を生成します。
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">1. 質問分析（QueryAnalyzer）</h4>
                <p className="text-sm text-gray-700">
                  ユーザーの質問を分析し、意図（事実確認・比較・手順・探索）と複雑度（simple / moderate / complex）を判定。
                  単純な質問は1回の検索で即座に回答します。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">2. 推論ループ（ReasoningEngine）</h4>
                <p className="text-sm text-gray-700">
                  LLMが「Thought（思考）→ Action（検索）→ Observation（結果評価）」のサイクルを最大3回繰り返し、
                  十分な情報が集まるまで段階的に検索を実行します。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">3. 回答合成（ResponseSynthesizer）</h4>
                <p className="text-sm text-gray-700">
                  複数の検索結果と推論過程を統合して最終回答を日本語で生成。
                  回答の確信度（0〜100%）も算出します。
                </p>
              </div>
            </div>
          </section>

          {/* LLMプロバイダーについて */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">LLMプロバイダーについて</h2>
            <p className="text-sm text-gray-700 mb-4">
              本アプリケーションは、環境変数の設定のみで複数のLLMプロバイダーを切り替えられます。
              すべてのプロバイダーに無料枠があり、費用をかけずに利用できます。
            </p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="border px-3 py-2">プロバイダー</th>
                    <th className="border px-3 py-2">デフォルトモデル</th>
                    <th className="border px-3 py-2">特徴</th>
                    <th className="border px-3 py-2">費用</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="border px-3 py-2 font-medium">Hugging Face</td>
                    <td className="border px-3 py-2"><code className="text-xs bg-gray-100 px-1 rounded">Qwen/Qwen2.5-7B-Instruct</code></td>
                    <td className="border px-3 py-2">日本語品質良好、安定動作</td>
                    <td className="border px-3 py-2 text-green-700 font-medium">無料枠あり</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-medium">Groq</td>
                    <td className="border px-3 py-2"><code className="text-xs bg-gray-100 px-1 rounded">deepseek-r1-distill-qwen-32b</code></td>
                    <td className="border px-3 py-2">LPUによる超高速推論</td>
                    <td className="border px-3 py-2 text-green-700 font-medium">無料枠あり</td>
                  </tr>
                  <tr>
                    <td className="border px-3 py-2 font-medium">OpenRouter</td>
                    <td className="border px-3 py-2"><code className="text-xs bg-gray-100 px-1 rounded">deepseek/deepseek-r1:free</code></td>
                    <td className="border px-3 py-2">無料モデル利用可能</td>
                    <td className="border px-3 py-2 text-green-700 font-medium">無料</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 openai パッケージについて</h3>
              <p className="text-sm text-blue-800 mb-2">
                本プロジェクトでは npm パッケージ <code className="bg-blue-100 px-1 rounded">openai</code> を使用していますが、
                これは OpenAI 社の API を利用しているわけではありません。
              </p>
              <p className="text-sm text-blue-800 mb-2">
                <code className="bg-blue-100 px-1 rounded">openai</code> パッケージは MIT ライセンスの無料オープンソースライブラリで、
                「OpenAI 互換 API」に接続するための汎用 HTTP クライアントです。
                Groq や OpenRouter は OpenAI と同じ API 仕様を採用しているため、
                接続先の URL（baseURL）を切り替えるだけで利用できます。
              </p>
              <div className="text-sm text-blue-800">
                <strong>費用まとめ:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li><code className="bg-blue-100 px-1 rounded">openai</code> npm パッケージ → 無料（MIT ライセンス）</li>
                  <li>Hugging Face API → 無料枠で動作</li>
                  <li>Groq API → 無料枠で動作</li>
                  <li>OpenRouter API → 無料モデルあり</li>
                  <li>OpenAI 社のサービスは一切使用していません</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              ※ <code className="bg-gray-100 px-1 rounded">LLM_PROVIDER</code> を設定しない場合、
              従来通り Hugging Face のみで動作します。Groq や OpenRouter の API キーは不要です。
            </p>
          </section>

          {/* FAQ元データ一覧 */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 FAQ元データ一覧</h2>
            <p className="text-sm text-gray-600 mb-2">
              チャットボットが参照しているFAQデータの全件です。
              チャットで以下の質問に近い内容を聞くと、該当するFAQがコンテキストとしてLLMに渡されて回答が生成されます。
            </p>
            <p className="text-xs text-gray-500 mb-6">
              全 {faqData.length} 件 / {categories.length} カテゴリ — ソース: <code className="bg-gray-100 px-1 rounded">scripts/faq-data.json</code>
            </p>

            {categories.map(category => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded mr-2">
                    {category}
                  </span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({faqData.filter(f => f.category === category).length}件)
                  </span>
                </h3>
                <div className="space-y-3 ml-2">
                  {faqData
                    .filter(faq => faq.category === category)
                    .map((faq, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4 py-2 hover:border-blue-400 transition-colors">
                        <p className="font-medium text-gray-900 mb-1">
                          Q: {faq.question}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          A: {faq.answer}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>

          {/* 注意事項 */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">注意事項</h2>
            <p className="text-gray-700 leading-relaxed">
              本プロジェクトはRAG技術の検証・学習を目的としたデモアプリケーションです。
              ワンダーランド東京は架空のテーマパークであり、実在しません。
              FAQデータはすべてAIによって生成された架空の情報です。
            </p>
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
