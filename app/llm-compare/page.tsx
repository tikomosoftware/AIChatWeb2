'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabMode = 'provider' | 'model';

// --- Provider comparison types ---

interface ReasoningStep {
  stepNumber: number;
  type: 'thought' | 'action' | 'observation';
  content: string;
  timestamp: number;
}

interface ProviderTestResult {
  provider: string;
  model: string;
  status: 'success' | 'error';
  answer: string;
  reasoningSteps: ReasoningStep[];
  totalSearches: number;
  confidence: number;
  duration: number;
  error?: string;
}

interface ProviderTestResponse {
  query: string;
  result: ProviderTestResult;
}

const PROVIDERS = [
  { id: 'huggingface', name: 'Hugging Face', model: 'Qwen/Qwen2.5-7B-Instruct', color: 'yellow' },
  { id: 'groq', name: 'Groq', model: 'deepseek-r1-distill-qwen-32b', color: 'blue' },
  { id: 'openrouter', name: 'OpenRouter', model: 'deepseek/deepseek-r1:free', color: 'purple' },
] as const;

// --- Model comparison types (existing) ---

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

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function providerBorderColor(color: string, status?: 'success' | 'error') {
  if (status === 'error') return 'border-red-300';
  switch (color) {
    case 'yellow': return 'border-yellow-400';
    case 'blue': return 'border-blue-400';
    case 'purple': return 'border-purple-400';
    default: return 'border-gray-300';
  }
}

function providerBgColor(color: string) {
  switch (color) {
    case 'yellow': return 'bg-yellow-50';
    case 'blue': return 'bg-blue-50';
    case 'purple': return 'bg-purple-50';
    default: return 'bg-gray-50';
  }
}

function providerCheckboxColor(color: string) {
  switch (color) {
    case 'yellow': return 'text-yellow-600';
    case 'blue': return 'text-blue-600';
    case 'purple': return 'text-purple-600';
    default: return 'text-gray-600';
  }
}

function providerBadgeBg(color: string) {
  switch (color) {
    case 'yellow': return 'bg-yellow-100 text-yellow-800';
    case 'blue': return 'bg-blue-100 text-blue-800';
    case 'purple': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ---------------------------------------------------------------------------
// ProviderResultCard component
// ---------------------------------------------------------------------------

function ProviderResultCard({
  result,
  providerDef,
}: {
  result: ProviderTestResult;
  providerDef: (typeof PROVIDERS)[number];
}) {
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <div
      className={`border-2 rounded-lg overflow-hidden ${providerBorderColor(providerDef.color, result.status)}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${providerBgColor(providerDef.color)}`}>
        <div className="flex items-center gap-2">
          <span>{result.status === 'success' ? '✅' : '❌'}</span>
          <span className="font-semibold text-gray-900">{providerDef.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${providerBadgeBg(providerDef.color)}`}>
            {result.model}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {(result.duration / 1000).toFixed(1)}秒
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {result.status === 'success' ? (
          <>
            {/* Metrics row */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">確信度:</span>
                <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">検索回数:</span>
                <span className="font-medium text-gray-700">{result.totalSearches}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">推論ステップ:</span>
                <span className="font-medium text-gray-700">{result.reasoningSteps.length}</span>
              </div>
            </div>

            {/* Answer */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.answer}
            </p>

            {/* Reasoning steps (collapsible) */}
            {result.reasoningSteps.length > 0 && (
              <div>
                <button
                  onClick={() => setStepsOpen((v) => !v)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{stepsOpen ? '▼' : '▶'}</span>
                  推論ステップを{stepsOpen ? '閉じる' : '表示'}
                </button>
                {stepsOpen && (
                  <div className="mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                    {result.reasoningSteps.map((step) => (
                      <div key={step.stepNumber} className="text-xs text-gray-600">
                        <span className="font-medium">
                          {step.type === 'thought' && '💭 思考'}
                          {step.type === 'action' && '🔍 アクション'}
                          {step.type === 'observation' && '👁 観察'}
                        </span>
                        <span className="ml-1 text-gray-400">#{step.stepNumber}</span>
                        <p className="ml-4 text-gray-500 whitespace-pre-wrap">{step.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-red-600">エラー: {result.error}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparisonSummaryTable component
// ---------------------------------------------------------------------------

function ComparisonSummaryTable({ results }: { results: Map<string, ProviderTestResult> }) {
  if (results.size === 0) return null;

  const entries = Array.from(results.entries());

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-x-auto">
      <h3 className="text-sm font-medium text-gray-700 mb-3">📊 比較サマリー</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 pr-4">プロバイダー</th>
            <th className="pb-2 pr-4">モデル</th>
            <th className="pb-2 pr-4">ステータス</th>
            <th className="pb-2 pr-4">応答時間</th>
            <th className="pb-2 pr-4">確信度</th>
            <th className="pb-2 pr-4">検索回数</th>
            <th className="pb-2">推論ステップ</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([providerId, result]) => {
            const def = PROVIDERS.find((p) => p.id === providerId);
            return (
              <tr key={providerId} className="border-b last:border-b-0">
                <td className="py-2 pr-4 font-medium text-gray-900">{def?.name ?? providerId}</td>
                <td className="py-2 pr-4 text-gray-600 text-xs">{result.model}</td>
                <td className="py-2 pr-4">
                  {result.status === 'success' ? (
                    <span className="text-green-600 font-medium">成功</span>
                  ) : (
                    <span className="text-red-600 font-medium">失敗</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-700">{(result.duration / 1000).toFixed(1)}秒</td>
                <td className="py-2 pr-4 text-gray-700">
                  {result.status === 'success' ? `${Math.round(result.confidence * 100)}%` : '-'}
                </td>
                <td className="py-2 pr-4 text-gray-700">
                  {result.status === 'success' ? result.totalSearches : '-'}
                </td>
                <td className="py-2 text-gray-700">
                  {result.status === 'success' ? result.reasoningSteps.length : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function LlmComparePage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>('provider');

  // --- Provider comparison state ---
  const [providerQuery, setProviderQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>(
    PROVIDERS.map((p) => p.id)
  );
  const [providerResults, setProviderResults] = useState<Map<string, ProviderTestResult>>(
    new Map()
  );
  const [providerLoading, setProviderLoading] = useState(false);

  // --- Model comparison state (existing) ---
  const [query, setQuery] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(
    DEFAULT_MODELS.slice(0, 3)
  );
  const [customModel, setCustomModel] = useState('');
  const [results, setResults] = useState<TestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Provider comparison handlers
  // ---------------------------------------------------------------------------

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const runProviderTest = async () => {
    const trimmed = providerQuery.trim();
    if (!trimmed || selectedProviders.length === 0) return;

    setProviderLoading(true);
    setProviderResults(new Map());

    try {
      const promises = selectedProviders.map(async (providerId) => {
        const res = await fetch('/api/llm-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, provider: providerId }),
        });
        const data: ProviderTestResponse = await res.json();
        return { providerId, result: data.result };
      });

      const settled = await Promise.allSettled(promises);
      const newResults = new Map<string, ProviderTestResult>();

      for (const outcome of settled) {
        if (outcome.status === 'fulfilled') {
          newResults.set(outcome.value.providerId, outcome.value.result);
        } else {
          // Find which provider failed — use index
          const idx = settled.indexOf(outcome);
          const providerId = selectedProviders[idx];
          const def = PROVIDERS.find((p) => p.id === providerId);
          newResults.set(providerId, {
            provider: providerId,
            model: def?.model ?? 'unknown',
            status: 'error',
            answer: '',
            reasoningSteps: [],
            totalSearches: 0,
            confidence: 0,
            duration: 0,
            error: 'リクエストに失敗しました',
          });
        }
      }

      setProviderResults(newResults);
    } catch {
      // Unexpected top-level error
    } finally {
      setProviderLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Model comparison handlers (existing)
  // ---------------------------------------------------------------------------

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
    } catch {
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            {/* タイトル */}
            <div className="border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                🔬 LLM比較テスト
              </h1>
              <p className="text-sm text-gray-600">
                プロバイダー間またはモデル間で、回答の精度・速度・推論品質を比較できます
              </p>
            </div>

            {/* タブ切り替え */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('provider')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'provider'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏢 プロバイダー比較
              </button>
              <button
                onClick={() => setActiveTab('model')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'model'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🤖 モデル比較
              </button>
            </div>

            {/* ================================================================ */}
            {/* プロバイダー比較タブ */}
            {/* ================================================================ */}
            {activeTab === 'provider' && (
              <div>
                {/* 質問入力 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テスト質問
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={providerQuery}
                      onChange={(e) => setProviderQuery(e.target.value)}
                      placeholder="質問を入力..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !providerLoading && runProviderTest()
                      }
                    />
                    <button
                      onClick={runProviderTest}
                      disabled={
                        providerLoading ||
                        !providerQuery.trim() ||
                        selectedProviders.length === 0
                      }
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {providerLoading ? 'テスト中...' : 'テスト実行'}
                    </button>
                  </div>

                  {/* サンプル質問 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 py-1">サンプル:</span>
                    {SAMPLE_QUERIES.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setProviderQuery(q)}
                        className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1 rounded-full transition-colors"
                      >
                        {q.length > 20 ? q.substring(0, 20) + '...' : q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* プロバイダー選択 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テスト対象プロバイダー（{selectedProviders.length}個選択中）
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PROVIDERS.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedProviders.includes(p.id)
                            ? `${providerBorderColor(p.color)} ${providerBgColor(p.color)}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProviders.includes(p.id)}
                          onChange={() => toggleProvider(p.id)}
                          className={`mt-0.5 rounded ${providerCheckboxColor(p.color)}`}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {p.name}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{p.model}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ローディング */}
                {providerLoading && (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      {selectedProviders.length}個のプロバイダーをテスト中...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      プロバイダーによっては30秒程度かかる場合があります
                    </p>
                  </div>
                )}

                {/* 結果表示 */}
                {providerResults.size > 0 && !providerLoading && (
                  <div>
                    {/* サマリーテーブル */}
                    <ComparisonSummaryTable results={providerResults} />

                    {/* サマリーカウント */}
                    <div className="flex gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg px-4 py-2">
                        <span className="text-2xl font-bold text-green-700">
                          {Array.from(providerResults.values()).filter(
                            (r) => r.status === 'success'
                          ).length}
                        </span>
                        <span className="text-sm text-green-600 ml-1">成功</span>
                      </div>
                      <div className="bg-red-50 rounded-lg px-4 py-2">
                        <span className="text-2xl font-bold text-red-700">
                          {Array.from(providerResults.values()).filter(
                            (r) => r.status === 'error'
                          ).length}
                        </span>
                        <span className="text-sm text-red-600 ml-1">失敗</span>
                      </div>
                    </div>

                    {/* 各プロバイダーの結果カード */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {PROVIDERS.filter((p) =>
                        providerResults.has(p.id)
                      ).map((p) => (
                        <ProviderResultCard
                          key={p.id}
                          result={providerResults.get(p.id)!}
                          providerDef={p}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* モデル比較タブ (既存機能) */}
            {/* ================================================================ */}
            {activeTab === 'model' && (
              <div>
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
                              <span>
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
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
