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
      // Hugging Face inference library has a known issue with multi-byte characters (e.g., Japanese)
      // when constructing HTTP requests. We use the raw fetch API to avoid the ByteString error.
      const key = process.env.HUGGINGFACE_API_KEY;
      const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.modelName}`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Hugging Face API error (${res.status}): ${errorText}`);
      }

      const response = await res.json();

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
