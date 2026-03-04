import { getOpenAIClient } from '@/services/openai/openai.client';
import { TranslateChunkRequest } from '@/types';

export const translateChunk = async ({
  model,
  texts,
  from,
  to,
  context,
  OPENAI_API_KEY,
}: TranslateChunkRequest): Promise<Record<string, string>> => {
  const systemPrompt = `
You are a professional software translation engine.

Application Context:
${context ?? "No additional context provided."}

Rules:
- Translate from ${from} to ${to}
- Keep placeholders like {{count}} unchanged
- Do NOT translate product names unless explicitly asked
- Return ONLY valid JSON
- Do not modify keys
- Do not add explanations
`;

  const client = getOpenAIClient(OPENAI_API_KEY);

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(texts),
      },
    ],
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
};