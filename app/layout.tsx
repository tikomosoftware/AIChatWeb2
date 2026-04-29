import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ワンダーランド東京 FAQ AIチャットボット - 技術検証用",
  description: "RAG技術を使用したFAQ AIチャットボット。ワンダーランド東京のFAQ情報を元に質問に回答します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
