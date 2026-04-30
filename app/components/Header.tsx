import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              ワンダーランド東京 FAQ AIチャットボット
            </Link>
            <span className="ml-3 px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded">
              探索ベースAI
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              チャット
            </Link>
            <Link 
              href="/llm-compare" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              モデル比較
            </Link>
            <Link 
              href="/help" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              ヘルプ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
