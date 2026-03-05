import { getOpenAIClient } from '@/services/openai/openai.client';
import { TranslateChunkRequest } from '@/types';

export const openAITranslateChunk = async ({
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
- Translate from ${from} to ${to}, following language-specific instructions.
- Keep all placeholders like {{count}}, {username}, {amount} unchanged.
- Do NOT translate product names, brands, or trademarks unless explicitly instructed.
- Maintain keys and JSON structure exactly as in the source.
- Return ONLY valid JSON, no explanations or extra text.
- For regional variants (en-GB, es-MX, etc.), use local expressions and spelling as per context.
`;

  const client = getOpenAIClient(OPENAI_API_KEY);

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(texts) },
      { role: "user", content: "Return a valid JSON object only, with all keys unchanged." },
    ],
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
};