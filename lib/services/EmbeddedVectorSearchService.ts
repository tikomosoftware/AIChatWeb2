import { promises as fs } from 'fs';
import path from 'path';

export interface SearchResult {
  document: string;
  metadata: Record<string, any>;
  score: number;
}

export interface VectorSearchConfig {
  topK: number;
  scoreThreshold: number;
}

interface EmbeddingData {
  id: string;
  document: string;
  embedding: number[];
  metadata: {
    url?: string;
    'chroma:document'?: string;
    [key: string]: any;
  };
}

export class EmbeddedVectorSearchService {
  private data: EmbeddingData[] = [];
  private config: VectorSearchConfig;
  private initialized: boolean = false;

  constructor(config: Partial<VectorSearchConfig> = {}) {
    this.config = {
      topK: config.topK || parseInt(process.env.VECTOR_SEARCH_TOP_K || "3"),
      scoreThreshold: config.scoreThreshold || parseFloat(process.env.VECTOR_SEARCH_THRESHOLD || "0.7"),
    };
  }

  /**
   * Initialize service by loading embeddings data
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try multiple possible paths for the embeddings file
      const possiblePaths = [
        path.join(process.cwd(), 'lib', 'data', 'embeddings.json'),
        path.join(process.cwd(), '.next', 'server', 'lib', 'data', 'embeddings.json'),
        path.join(__dirname, '..', 'data', 'embeddings.json'),
      ];

      let fileContent: string | null = null;
      let loadedFrom: string | null = null;

      for (const filePath of possiblePaths) {
        try {
          fileContent = await fs.readFile(filePath, 'utf-8');
          loadedFrom = filePath;
          break;
        } catch (error) {
          // Try next path
          continue;
        }
      }

      if (!fileContent) {
        throw new Error('embeddings.json file not found in any expected location');
      }

      this.data = JSON.parse(fileContent) as EmbeddingData[];
      
      if (!Array.isArray(this.data) || this.data.length === 0) {
        throw new Error('Invalid or empty embeddings data');
      }

      // Log embedding dimensions for debugging
      if (this.data.length > 0 && this.data[0].embedding) {
        console.log(`Stored embedding dimensions: ${this.data[0].embedding.length}`);
      }

      this.initialized = true;
      console.log(`Loaded ${this.data.length} embedded documents from ${loadedFrom}`);
    } catch (error) {
      console.error('Failed to load embeddings data:', error);
      throw new Error(`Failed to initialize vector search service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Search for similar documents using query embeddings
   * @param queryEmbedding - The embedding vector of the query
   * @param topK - Number of results to return (optional, uses config default)
   * @returns Array of search results with documents, metadata, and scores
   */
  async search(
    queryEmbedding: number[],
    topK?: number
  ): Promise<SearchResult[]> {
    try {
      if (!this.initialized) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      const k = topK || this.config.topK;

      // Calculate similarity scores for all documents
      const results = this.data.map(item => {
        // Get document text from either document field or metadata['chroma:document']
        const documentText = item.document || item.metadata['chroma:document'] || '';
        
        return {
          document: documentText,
          metadata: item.metadata,
          score: this.cosineSimilarity(queryEmbedding, item.embedding),
        };
      });

      // Sort by score (descending) and take top K
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, k);

      // Filter by score threshold and ensure document is not empty
      const filteredResults = topResults.filter(
        (result) => result.score >= this.config.scoreThreshold && result.document.trim().length > 0
      );

      return filteredResults;
    } catch (error) {
      console.error("Vector search failed:", error);
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): VectorSearchConfig {
    return { ...this.config };
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.data.length > 0;
  }
}
