import { HfInference } from "@huggingface/inference";

export class EmbeddingService {
  private client: HfInference;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error("Hugging Face API key is required");
    }

    this.client = new HfInference(key);
    this.modelName = modelName || process.env.HUGGINGFACE_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
  }

  /**
   * Generate embeddings for a text query
   * @param text - The text to embed
   * @returns The embedding vector as an array of numbers
   */
  async embedQuery(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    try {
      const response = await this.client.featureExtraction({
        model: this.modelName,
        inputs: text,
      });

      // The response is already an array of numbers (embedding vector)
      return response as number[];
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.modelName;
  }
}
