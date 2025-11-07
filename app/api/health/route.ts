import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Health check endpoint to diagnose deployment issues
 */
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: __dirname,
    envVars: {
      hasHuggingfaceApiKey: !!process.env.HUGGINGFACE_API_KEY,
      huggingfaceModel: process.env.HUGGINGFACE_MODEL || 'not set',
      embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'not set',
      vectorSearchTopK: process.env.VECTOR_SEARCH_TOP_K || 'not set',
      vectorSearchThreshold: process.env.VECTOR_SEARCH_THRESHOLD || 'not set',
    },
    files: {
      embeddingsJson: {
        exists: false,
        path: '',
        size: 0,
        error: null,
      }
    }
  };

  // Check for embeddings.json file
  const possiblePaths = [
    path.join(process.cwd(), 'lib', 'data', 'embeddings.json'),
    path.join(process.cwd(), '.next', 'server', 'lib', 'data', 'embeddings.json'),
    path.join(__dirname, '..', '..', '..', 'lib', 'data', 'embeddings.json'),
  ];

  for (const filePath of possiblePaths) {
    try {
      const stats = await fs.stat(filePath);
      diagnostics.files.embeddingsJson = {
        exists: true,
        path: filePath,
        size: stats.size,
        error: null,
      };
      
      // Try to read and parse the file
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        diagnostics.files.embeddingsJson.recordCount = Array.isArray(data) ? data.length : 0;
        diagnostics.files.embeddingsJson.isValidArray = Array.isArray(data);
      } catch (parseError) {
        diagnostics.files.embeddingsJson.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      }
      
      break;
    } catch (error) {
      // File not found at this path, try next
      continue;
    }
  }

  // If no file was found, record all attempted paths
  if (!diagnostics.files.embeddingsJson.exists) {
    diagnostics.files.embeddingsJson.attemptedPaths = possiblePaths;
    diagnostics.files.embeddingsJson.error = 'File not found in any expected location';
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
