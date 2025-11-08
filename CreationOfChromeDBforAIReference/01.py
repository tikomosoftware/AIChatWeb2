# FAQ データのスクレイピングとベクトル化

import os
from playwright.sync_api import sync_playwright, TimeoutError
from bs4 import BeautifulSoup
import time
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
import numpy as np
import json

# カスタムEmbeddingsクラスの作成（SentenceTransformersを使用）
class SentenceTransformerEmbeddings(Embeddings):
    def __init__(self, model_name="intfloat/multilingual-e5-large"):
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts):
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def embed_query(self, text):
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

urls = [
    "https://www.meijimura.com/guide/beginner/"
]

texts = []

with sync_playwright() as p:
    try:
        # ブラウザの起動
        browser = p.chromium.launch(
            headless=True  # headless=False でブラウザを表示させることも可能
        )
        
        # ブラウザコンテキストの作成（User-Agent設定含む）
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        page.set_default_timeout(60000)  # タイムアウトを60秒に設定
        
        for url in urls:
            try:
                print(f"Accessing: {url}")
                # ページに移動
                page.goto(url, wait_until='domcontentloaded')
                
                # ページが安定するまで少し待機
                time.sleep(5)
                
                # スクロールしてコンテンツを完全に読み込む
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
                
                # HTMLを取得して解析
                html = page.content()
                soup = BeautifulSoup(html, "html.parser")
                
                # メインコンテンツの抽出（複数の要素を試みる）
                content = []
                
                # 主要なコンテンツエリアの特定と抽出
                main_content = soup.find('main') or soup.find(class_='main-content') or soup.find(id='main')
                if main_content:
                    # 不要な要素を削除
                    for elem in main_content.find_all(['script', 'style', 'nav', 'header', 'footer']):
                        elem.decompose()
                    
                    # 段落とヘッディングを抽出
                    for elem in main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li']):
                        text = elem.get_text(strip=True)
                        if text and len(text) > 1:  # 空や1文字の要素を除外
                            content.append(text)
                
                # コンテンツが見つからない場合の代替手段
                if not content:
                    # class="content"や"article"などの一般的なコンテンツ領域を探す
                    for class_name in ['content', 'article', 'entry', 'post']:
                        elements = soup.find_all(class_=class_name)
                        for elem in elements:
                            text = elem.get_text(strip=True)
                            if text and len(text) > 1:
                                content.append(text)
                
                # 結果を保存
                final_content = '\n'.join(content)
                texts.append({
                    "url": url,
                    "content": final_content,
                    "sections": content  # 個別のセクションも保持
                })
                
                # デバッグ情報の出力
                print(f"\nFound {len(content)} content sections")
                if content:
                    print("\nFirst 3 sections:")
                    for i, section in enumerate(content[:3]):
                        print(f"{i+1}. {section[:100]}...")
                
                print(f"Successfully scraped: {url}")
                
            except TimeoutError as e:
                print(f"Timeout error for {url}: {str(e)}")
                continue
            except Exception as e:
                print(f"Error processing {url}: {str(e)}")
                continue
    
    finally:
        # ブラウザを確実に終了
        browser.close()

# テキストを分割してドキュメント化
text_splitter = CharacterTextSplitter(
    separator="\n",
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

documents = []
for text in texts:
    chunks = text_splitter.split_text(text['content'])
    for chunk in chunks:
        doc = Document(
            page_content=chunk,
            metadata={"url": text['url']}
        )
        documents.append(doc)

print(f"\nCreated {len(documents)} documents from the scraped content")

# Embeddings の設定（日本語対応モデルを使用）
embeddings = SentenceTransformerEmbeddings(model_name="intfloat/multilingual-e5-large")

# Chroma DBの作成
db = Chroma.from_documents(
    documents=documents,
    embedding=embeddings,
    persist_directory="./chroma_db"  # データを保存するディレクトリ
)

# データベースの永続化
db.persist()

# 検索テスト
print("\nTesting vector search...")
query = "明治村の見どころは何ですか？"
results = db.similarity_search(query, k=3)

print(f"\nTop 3 relevant chunks for query: '{query}'")
for i, doc in enumerate(results, 1):
    print(f"\n{i}. Content: {doc.page_content[:200]}...")
    print(f"   Source: {doc.metadata['url']}")

# Vercelにデプロイするためのデータエクスポート
export_data = {
    "documents": [
        {
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embeddings": embeddings.embed_query(doc.page_content)
        }
        for doc in documents
    ]
}

with open("faq_embeddings.json", "w", encoding="utf-8") as f:
    json.dump(export_data, f, ensure_ascii=False, indent=2)