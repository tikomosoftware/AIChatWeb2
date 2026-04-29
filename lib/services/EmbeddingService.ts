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
    this.modelName = modelName || process.env.HUGGINGFACE_EMBEDDING_MODEL || "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    try {
      const response = await this.client.featureExtraction({
        model: this.modelName,
        inputs: text,
      });

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
