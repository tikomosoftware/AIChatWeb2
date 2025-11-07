import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "明治村FAQ AIチャットボット - 技術検証用",
  description: "RAG技術を使用した明治村FAQ AIチャットボット。博物館明治村のFAQ情報を元に質問に回答します。",
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
