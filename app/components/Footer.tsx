export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <strong className="text-red-600">※ 本サイトは技術検証用のデモアプリケーションです</strong>
          </p>
          <p className="text-xs text-gray-500">
            ワンダーランド東京は架空のテーマパークです。FAQデータはAIによって生成された架空の情報です。
          </p>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} 探索ベースAI 技術検証プロジェクト
          </p>
        </div>
      </div>
    </footer>
  );
}
