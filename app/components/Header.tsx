import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              明治村FAQ AIチャットボット
            </Link>
            <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              技術検証用
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
