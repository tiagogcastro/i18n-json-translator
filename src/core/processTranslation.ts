import { translateChunk } from "@/services/openai/openai.service";
import { ProcessTranslationRequest, ProcessTranslationResult } from '@/types';
import fs from "fs-extra";
import path from "path";

export async function processTranslation({
  baseJSON,
  targetLocale,
  baseLocale,
  targetFilePath,
  chunkSize,
  model,
  context,
  OPENAI_API_KEY,
}: ProcessTranslationRequest): Promise<ProcessTranslationResult> {
  let aiRequests = 0;
  let keysAdded = 0;
  let keysRemoved = 0;

  await fs.ensureDir(path.dirname(targetFilePath));

  let targetJSON: Record<string, string> = {};
  if (await fs.pathExists(targetFilePath)) {
    targetJSON = await fs.readJson(targetFilePath);
  }

  Object.keys(targetJSON).forEach((key) => {
    if (!(key in baseJSON)) {
      delete targetJSON[key];
      keysRemoved++;
    }
  });

  const missingKeys = Object.keys(baseJSON).filter((key) => !(key in targetJSON));

  for (let i = 0; i < missingKeys.length; i += chunkSize) {
    const chunkKeys = missingKeys.slice(i, i + chunkSize);
    if (!chunkKeys.length) continue;

    const chunkObject: Record<string, string> = {};
    chunkKeys.forEach((key) => {
      chunkObject[key] = baseJSON[key];
    });

    const translated = await translateChunk({
      model,
      texts: chunkObject,
      from: baseLocale,
      to: targetLocale,
      context,
      OPENAI_API_KEY,
    });

    aiRequests++;
    keysAdded += chunkKeys.length;

    // atualiza target diretamente
    Object.assign(targetJSON, translated);
  }

  // fallback para qualquer key que esteja faltando
  Object.keys(baseJSON).forEach((key) => {
    if (!(key in targetJSON)) targetJSON[key] = baseJSON[key];
  });

  // **Garantir a ordem do baseJSON**
  const orderedJSON: Record<string, string> = {};
  Object.keys(baseJSON).forEach((key) => {
    orderedJSON[key] = targetJSON[key];
  });

  await fs.writeFile(
    targetFilePath,
    JSON.stringify(orderedJSON, null, 2)
  );

  return {
    aiRequests,
    keysAdded,
    keysRemoved,
    modified: keysAdded > 0 || keysRemoved > 0,
    baseTotal: Object.keys(baseJSON).length,
    finalTotal: Object.keys(orderedJSON).length,
  };
}