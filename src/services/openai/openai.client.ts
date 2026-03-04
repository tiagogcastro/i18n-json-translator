import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(OPENAI_API_KEY: string) {
  if (!openaiClient) {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not found in environment");
    }

    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  return openaiClient;
}