import embeddingsData from '../data/embeddings.json';

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
  metadata: Record<string, any>;
}

export class EmbeddedVectorSearchService {
  private data: EmbeddingData[];
  private config: VectorSearchConfig;

  constructor(config: Partial<VectorSearchConfig> = {}) {
    this.data = embeddingsData as EmbeddingData[];
    this.config = {
      topK: config.topK || parseInt(process.env.VECTOR_SEARCH_TOP_K || "3"),
      scoreThreshold: config.scoreThreshold || parseFloat(process.env.VECTOR_SEARCH_THRESHOLD || "0.7"),
    };
  }

  /**
   * Initialize service (no-op for embedded data, kept for interface compatibility)
   */
  async initialize(): Promise<void> {
    console.log(`Loaded ${this.data.length} embedded documents`);
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
      const k = topK || this.config.topK;

      // Calculate similarity scores for all documents
      const results = this.data.map(item => ({
        document: item.document,
        metadata: item.metadata,
        score: this.cosineSimilarity(queryEmbedding, item.embedding),
      }));

      // Sort by score (descending) and take top K
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, k);

      // Filter by score threshold
      const filteredResults = topResults.filter(
        (result) => result.score >= this.config.scoreThreshold
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
    return this.data.length > 0;
  }
}
