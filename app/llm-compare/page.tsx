'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ModelResult {
  model: string;
  status: 'success' | 'error';
  response: string;
  duration: number;
  error?: string;
}

interface TestResponse {
  query: string;
  context: {
    resultsCount: number;
    topScores: string[];
  };
  results: ModelResult[];
  error?: string;
}

const DEFAULT_MODELS = [
  'Qwen/Qwen2.5-7B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/Phi-3-mini-4k-instruct',
  'HuggingFaceH4/zephyr-7b-beta',
  'google/gemma-2-2b-it',
];

const SAMPLE_QUERIES = [
  'ワンダーランド東京の営業時間を教えてください',
  '入場チケットの料金はいくらですか？',
  '人気のアトラクションは何ですか？',
  'ペットを連れて入場できますか？',
  '雨の日でも楽しめますか？',
];

export default function LlmComparePage() {
  const [query, setQuery] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(
    DEFAULT_MODELS.slice(0, 3)
  );
  const [customModel, setCustomModel] = useState('');
  const [results, setResults] = useState<TestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    );
  };

  const addCustomModel = () => {
    const trimmed = customModel.trim();
    if (trimmed && !selectedModels.includes(trimmed)) {
      setSelectedModels((prev) => [...prev, trimmed]);
      setCustomModel('');
    }
  };

  const runTest = async () => {
    if (!query.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/llm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          models: selectedModels,
        }),
      });

      const data: TestResponse = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        query: query.trim(),
        context: { resultsCount: 0, topScores: [] },
        results: [],
        error: 'リクエストに失敗しました',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            {/* タイトル */}
            <div className="border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                🔬 LLMモデル比較テスト
              </h1>
              <p className="text-sm text-gray-600">
                同じ質問を複数のLLMモデルに投げて、回答の精度・速度・可用性を比較できます
              </p>
            </div>

            {/* 質問入力 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                テスト質問
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="質問を入力..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && runTest()}
                />
                <button
                  onClick={runTest}
                  disabled={isLoading || !query.trim() || selectedModels.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isLoading ? 'テスト中...' : 'テスト実行'}
                </button>
              </div>

              {/* サンプル質問 */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 py-1">サンプル:</span>
                {SAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {q.length > 20 ? q.substring(0, 20) + '...' : q}
                  </button>
                ))}
              </div>
            </div>

            {/* モデル選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                テスト対象モデル（{selectedModels.length}個選択中）
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                {DEFAULT_MODELS.map((model) => (
                  <label
                    key={model}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedModels.includes(model)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model)}
                      onChange={() => toggleModel(model)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700 truncate">{model}</span>
                  </label>
                ))}
              </div>

              {/* カスタムモデル追加 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="カスタムモデル名を追加（例: org/model-name）"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomModel()}
                />
                <button
                  onClick={addCustomModel}
                  className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg transition-colors"
                >
                  追加
                </button>
              </div>

              {/* 選択中のカスタムモデル表示 */}
              {selectedModels
                .filter((m) => !DEFAULT_MODELS.includes(m))
                .map((model) => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1 mt-2 mr-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                  >
                    {model}
                    <button
                      onClick={() => toggleModel(model)}
                      className="hover:text-purple-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>

            {/* ローディング */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {selectedModels.length}個のモデルをテスト中...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  モデルによっては30秒程度かかる場合があります
                </p>
              </div>
            )}

            {/* 結果表示 */}
            {results && !isLoading && (
              <div>
                {/* コンテキスト情報 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    📊 ベクトル検索結果
                  </h3>
                  <div className="text-sm text-gray-600">
                    <span>
                      ヒット数: {results.context.resultsCount}件
                    </span>
                    {results.context.topScores.length > 0 && (
                      <span className="ml-4">
                        類似度スコア: {results.context.topScores.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {results.error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                    <p className="text-sm text-red-800">{results.error}</p>
                  </div>
                )}

                {/* サマリー */}
                <div className="flex gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-2xl font-bold text-green-700">
                      {results.results.filter((r) => r.status === 'success').length}
                    </span>
                    <span className="text-sm text-green-600 ml-1">成功</span>
                  </div>
                  <div className="bg-red-50 rounded-lg px-4 py-2">
                    <span className="text-2xl font-bold text-red-700">
                      {results.results.filter((r) => r.status === 'error').length}
                    </span>
                    <span className="text-sm text-red-600 ml-1">失敗</span>
                  </div>
                </div>

                {/* 各モデルの結果 */}
                <div className="space-y-4">
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg overflow-hidden ${
                        result.status === 'success'
                          ? 'border-green-200'
                          : 'border-red-200'
                      }`}
                    >
                      {/* モデルヘッダー */}
                      <div
                        className={`px-4 py-3 flex items-center justify-between ${
                          result.status === 'success'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg ${
                              result.status === 'success' ? '' : ''
                            }`}
                          >
                            {result.status === 'success' ? '✅' : '❌'}
                          </span>
                          <span className="font-medium text-gray-900 text-sm">
                            {result.model}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(result.duration / 1000).toFixed(1)}秒
                        </span>
                      </div>

                      {/* 回答内容 */}
                      <div className="px-4 py-3">
                        {result.status === 'success' ? (
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {result.response}
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">
                            エラー: {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
