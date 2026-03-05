import { BuildDefaultSystemPromptRequest } from '@/types';

export function buildDefaultSystemPrompt({
  from,
  to,
  context,
  texts,
  useTextsInPrompt = false
}: BuildDefaultSystemPromptRequest) {
  return `
You are a professional software translation engine.

Application Context:
${context ?? "No additional context provided."}

Rules:
- Translate from ${from} to ${to}.
- Keep placeholders like {{count}}, {username}, {amount} unchanged.
- Do NOT translate product names, brands, or trademarks.
- Maintain JSON keys exactly as received.
- Return ONLY valid JSON.
- Respect regional language variants.

${useTextsInPrompt && (
      `JSON to translate:
${JSON.stringify(texts, null, 2)}
`)}
`;
}