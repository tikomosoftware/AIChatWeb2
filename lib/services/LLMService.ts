export interface GenerateResponseOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export class LLMService {
  private apiKey: string;
  private modelName: string;
  private defaultTimeout: number;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error("Hugging Face API key is required");
    }

    this.apiKey = key;
    this.modelName = modelName || process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-7B-Instruct";
    this.defaultTimeout = parseInt(process.env.REQUEST_TIMEOUT || "30000");
  }

  /**
   * Generate a response using the LLM
   * Uses native https module to avoid Next.js fetch patching issues with multi-byte characters
   */
  async generateResponse(
    query: string,
    context: string[],
    options: GenerateResponseOptions = {}
  ): Promise<string> {
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }

    const contextText = context.join("\n\n");
    const timeout = options.timeout || this.defaultTimeout;

    try {
      const apiUrl = `https://api-inference.huggingface.co/models/${this.modelName}/v1/chat/completions`;
      const bodyStr = JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: "あなたはワンダーランド東京の親切なFAQアシスタントです。提供されたコンテキスト情報のみを使用して、ユーザーの質問に日本語で正確に回答してください。コンテキストに含まれない情報については「申し訳ございませんが、その情報は持ち合わせておりません」と回答してください。"
          },
          {
            role: "user",
            content: `以下のコンテキスト情報を参考にして質問に答えてください。\n\nコンテキスト:\n${contextText}\n\n質問: ${query}`
          }
        ],
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
      });

      const responseData = await new Promise<string>((resolve, reject) => {
        const https = require("https");
        const url = new URL(apiUrl);

        const timer = setTimeout(() => {
          req.destroy();
          reject(new Error("Request timeout"));
        }, timeout);

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
              clearTimeout(timer);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(data);
              } else {
                if (res.statusCode === 429 || data.includes("rate limit")) {
                  reject(new Error("RATE_LIMIT_ERROR"));
                } else {
                  reject(new Error(`Hugging Face API error (${res.statusCode}): ${data}`));
                }
              }
            });
          }
        );

        req.on("error", (err: Error) => {
          clearTimeout(timer);
          reject(err);
        });
        req.write(bodyStr);
        req.end();
      });

      const response = JSON.parse(responseData);
      const generatedText = response.choices?.[0]?.message?.content || "";
      return generatedText.trim();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "RATE_LIMIT_ERROR") {
          throw error;
        }
        if (error.message.includes("timeout") || error.message === "Request timeout") {
          throw new Error("TIMEOUT_ERROR");
        }
      }

      console.error("LLM generation failed:", error);
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
