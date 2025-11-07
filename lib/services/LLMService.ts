import { HfInference } from "@huggingface/inference";

export interface GenerateResponseOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export class LLMService {
  private client: HfInference;
  private modelName: string;
  private defaultTimeout: number;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error("Hugging Face API key is required");
    }

    this.client = new HfInference(key);
    this.modelName = modelName || process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
    this.defaultTimeout = parseInt(process.env.REQUEST_TIMEOUT || "30000");
  }

  /**
   * Create a prompt template with context and query
   * @param query - User's question
   * @param context - Retrieved documents from vector search
   * @returns Formatted prompt string
   */
  private createPrompt(query: string, context: string[]): string {
    const contextText = context.join("\n\n");
    
    return `以下のコンテキスト情報を使用して、ユーザーの質問に日本語で回答してください。
コンテキストに関連する情報がない場合は、その旨を伝えてください。

コンテキスト:
${contextText}

質問: ${query}

回答:`;
  }

  /**
   * Generate a response using the LLM
   * @param query - User's question
   * @param context - Retrieved documents from vector search
   * @param options - Optional generation parameters
   * @returns Generated response text
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
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), timeout);
      });

      // Create the API call promise using chatCompletion
      const apiPromise = this.client.chatCompletion({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: "あなたは親切なアシスタントです。提供されたコンテキスト情報を使用して、ユーザーの質問に日本語で正確に回答してください。"
          },
          {
            role: "user",
            content: `以下のコンテキスト情報を参考にして質問に答えてください。\n\nコンテキスト:\n${contextText}\n\n質問: ${query}`
          }
        ],
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
      });

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      const generatedText = response.choices[0]?.message?.content || "";
      return generatedText.trim();
    } catch (error) {
      // Handle rate limiting errors
      if (error instanceof Error) {
        if (error.message.includes("rate limit") || error.message.includes("429")) {
          throw new Error("RATE_LIMIT_ERROR");
        }
        if (error.message.includes("timeout")) {
          throw new Error("TIMEOUT_ERROR");
        }
      }

      console.error("LLM generation failed:", error);
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.modelName;
  }
}
