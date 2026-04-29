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
   * Uses native https module to avoid Next.js fetch patching issues with multi-byte characters
   */
  async embedQuery(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    try {
      const apiUrl = `https://api-inference.huggingface.co/models/${this.modelName}`;
      const bodyStr = JSON.stringify({ inputs: text });

      const response = await new Promise<string>((resolve, reject) => {
        const https = require("https");
        const url = new URL(apiUrl);

        const req = https.request(
          {
            hostname: url.hostname,
            path: url.pathname,
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(bodyStr, "utf-8"),
            },
          },
          (res: any) => {
            let data = "";
            res.on("data", (chunk: string) => (data += chunk));
            res.on("end", () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(data);
              } else {
                reject(new Error(`Hugging Face API error (${res.statusCode}): ${data}`));
              }
            });
          }
        );

        req.on("error", reject);
        req.write(bodyStr);
        req.end();
      });

      return JSON.parse(response) as number[];
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
