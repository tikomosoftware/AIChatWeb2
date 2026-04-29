export class EmbeddingService {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error("Hugging Face API key is required");
    }

    this.apiKey = key;
    this.modelName = modelName || process.env.HUGGINGFACE_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
  }

  /**
   * Generate embeddings for a text query
   * Uses raw fetch to avoid ByteString errors with multi-byte characters (Japanese, etc.)
   */
  async embedQuery(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    try {
      const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.modelName}`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Hugging Face API error (${res.status}): ${errorText}`);
      }

      const response = await res.json();
      return response as number[];
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
