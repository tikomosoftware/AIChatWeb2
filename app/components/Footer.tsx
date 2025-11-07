export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <strong className="text-red-600">※ 本サイトは技術検証用のデモアプリケーションです</strong>
          </p>
          <p className="text-xs text-gray-500">
            博物館明治村様の公式サイトではありません。FAQデータは学習・検証目的で使用させていただいております。
          </p>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} 技術検証プロジェクト | データ提供元: 
            <a 
              href="https://www.meijimura.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              博物館明治村
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
