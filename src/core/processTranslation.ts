import { openAITranslateChunk } from "@/services/openai/openai.service";
import { ProcessTranslationRequest, ProcessTranslationResult, TranslateChunkFunction } from '@/types';
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
  translateChunk, // optional: allows custom AI function
}: ProcessTranslationRequest & { translateChunk?: TranslateChunkFunction }): Promise<ProcessTranslationResult> {
  let aiRequests = 0;
  let keysAdded = 0;
  let keysRemoved = 0;

  await fs.ensureDir(path.dirname(targetFilePath));

  let targetJSON: Record<string, string> = {};
  if (await fs.pathExists(targetFilePath)) {
    targetJSON = await fs.readJson(targetFilePath);
  }

  // Remove keys that are no longer in the base
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

    // Use the user-provided translateChunk function if available
    const translateFn = translateChunk ?? openAITranslateChunk;

    const translated = await translateFn({
      model,
      texts: chunkObject,
      from: baseLocale,
      to: targetLocale,
      context,
      OPENAI_API_KEY,
    });

    aiRequests++;
    keysAdded += chunkKeys.length;

    // Update target JSON
    Object.assign(targetJSON, translated);
  }

  // fallback for any missing keys
  Object.keys(baseJSON).forEach((key) => {
    if (!(key in targetJSON)) targetJSON[key] = baseJSON[key];
  });

  // maintain baseJSON order
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