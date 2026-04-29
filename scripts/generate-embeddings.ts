/**
 * FAQデータのベクトル化スクリプト
 * 
 * 使い方:
 *   npx tsx scripts/generate-embeddings.ts
 * 
 * 前提:
 *   - .env.local に HUGGINGFACE_API_KEY が設定されていること
 *   - scripts/faq-data.json にFAQデータが配置されていること
 * 
 * 出力:
 *   - lib/data/embeddings.json にベクトル化されたデータが出力される
 */

import { promises as fs } from 'fs';
import path from 'path';

// .env.local を手動で読み込む
async function loadEnv(): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch {
    console.error('.env.local が見つかりません。HUGGINGFACE_API_KEY を環境変数で設定してください。');
  }
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

interface EmbeddingRecord {
  id: string;
  document: string;
  embedding: number[];
  metadata: {
    category: string;
    question: string;
  };
}

/**
 * Hugging Face API でテキストをベクトル化する
 * ランタイム (EmbeddingService.ts) と同じ @huggingface/inference ライブラリを使用
 */
async function embedText(text: string, apiKey: string, model: string): Promise<number[]> {
  const { HfInference } = await import('@huggingface/inference');
  const client = new HfInference(apiKey);

  const response = await client.featureExtraction({
    model,
    inputs: text,
  });

  return response as number[];
}

// HfInference インスタンスをキャッシュ（毎回importしないように）
let _hfClient: any = null;
async function getHfClient(apiKey: string): Promise<any> {
  if (!_hfClient) {
    const { HfInference } = await import('@huggingface/inference');
    _hfClient = new HfInference(apiKey);
  }
  return _hfClient;
}

async function embedTextCached(text: string, apiKey: string, model: string): Promise<number[]> {
  const client = await getHfClient(apiKey);
  const response = await client.featureExtraction({
    model,
    inputs: text,
  });
  return response as number[];
}

/**
 * UUIDv4 を生成する（crypto不要の簡易版）
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function main(): Promise<void> {
  console.log('=== FAQ ベクトル化スクリプト ===\n');

  // 環境変数の読み込み
  await loadEnv();

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error('エラー: HUGGINGFACE_API_KEY が設定されていません。');
    process.exit(1);
  }

  // 埋め込みモデル（ランタイムと同じモデルを使用すること！）
  const embeddingModel = process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
  console.log(`埋め込みモデル: ${embeddingModel}`);

  // FAQデータの読み込み
  const faqPath = path.join(process.cwd(), 'scripts', 'faq-data.json');
  let faqData: FaqItem[];
  try {
    const faqContent = await fs.readFile(faqPath, 'utf-8');
    faqData = JSON.parse(faqContent) as FaqItem[];
    console.log(`FAQデータ: ${faqData.length} 件読み込み\n`);
  } catch (error) {
    console.error(`エラー: ${faqPath} の読み込みに失敗しました。`);
    console.error('scripts/faq-data.json を作成してください。');
    process.exit(1);
  }

  // ベクトル化
  const embeddings: EmbeddingRecord[] = [];
  for (let i = 0; i < faqData.length; i++) {
    const faq = faqData[i];
    // Q&A を結合してベクトル化（検索精度向上のため）
    const documentText = `Q: ${faq.question}\nA: ${faq.answer}`;

    process.stdout.write(`[${i + 1}/${faqData.length}] ベクトル化中: ${faq.question.substring(0, 40)}...`);

    try {
      const embedding = await embedTextCached(documentText, apiKey, embeddingModel);

      embeddings.push({
        id: generateId(),
        document: documentText,
        embedding,
        metadata: {
          category: faq.category,
          question: faq.question,
        },
      });

      console.log(` OK (${embedding.length}次元)`);
    } catch (error) {
      console.log(` FAILED`);
      console.error(`  エラー: ${error instanceof Error ? error.message : String(error)}`);

      // レート制限の場合は少し待つ
      if (error instanceof Error && error.message.includes('429')) {
        console.log('  レート制限のため10秒待機...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        i--; // リトライ
        continue;
      }
    }

    // API レート制限対策（少し間隔を空ける）
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 出力
  const outputPath = path.join(process.cwd(), 'lib', 'data', 'embeddings.json');
  await fs.writeFile(outputPath, JSON.stringify(embeddings, null, 2), 'utf-8');

  console.log(`\n=== 完了 ===`);
  console.log(`出力: ${outputPath}`);
  console.log(`レコード数: ${embeddings.length}`);
  if (embeddings.length > 0) {
    console.log(`ベクトル次元数: ${embeddings[0].embedding.length}`);
  }
}

main().catch(console.error);
