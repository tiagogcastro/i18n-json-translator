import { processTranslation } from '@/core/processTranslation';
import { generateSummaryMarkdown, saveSummary } from "@/services/report.service";
import { ProcessTranslationResult, TranslateOptions } from "@/types";
import { getAllJsonFilesFromLocale } from "@/utils/filesystem.utils";
import fs from "fs-extra";
import path from "path";

export async function runTranslation({
  baseLocale,
  targetLocales,
  model,
  basePath,
  chunkSize = 10,
  context,
  reportOptions,
  OPENAI_API_KEY,
}: TranslateOptions) {
  const startedAt = new Date();

  let totalAIRequests = 0;
  let totalKeysAdded = 0;
  let totalKeysRemoved = 0;
  let totalFilesProcessed = 0;
  let totalBaseFiles = 0;
  let totalModifiedFiles = 0;
  let totalSyncedFiles = 0;

  const fileDetails: Record<string, any> = {};

  const baseLocaleFolder = path.join(basePath, baseLocale);
  const baseLocaleFile = path.join(basePath, `${baseLocale}.json`);

  const isFolderMode = await fs.pathExists(baseLocaleFolder);
  const isFileMode = await fs.pathExists(baseLocaleFile);

  if (!isFolderMode && !isFileMode) {
    throw new Error(`Base locale "${baseLocale}" not found in ${basePath}`);
  }

  let totalToProcess = 0;
  let baseFiles: string[] = [];

  if (isFolderMode) {
    baseFiles = await getAllJsonFilesFromLocale({ basePath, locale: baseLocale });
    totalBaseFiles += baseFiles.length;
    totalToProcess += baseFiles.length * targetLocales.length;
  }

  if (isFileMode) {
    totalBaseFiles += 1;
    totalToProcess += targetLocales.length;
  }

  let currentProgress = 0;

  const handleResult = (result: ProcessTranslationResult) => {
    totalAIRequests += result.aiRequests;
    totalKeysAdded += result.keysAdded;
    totalKeysRemoved += result.keysRemoved;
    totalFilesProcessed++;

    if (result.modified) totalModifiedFiles++;
    else totalSyncedFiles++;
  };

  if (isFolderMode) {
    for (const baseFilePath of baseFiles) {
      const baseJSON = await fs.readJson(baseFilePath);
      const relativePath = path.relative(path.join(basePath, baseLocale), baseFilePath);
      fileDetails[relativePath] = [];

      for (const locale of targetLocales) {
        if (locale === baseLocale) continue;
        currentProgress++;

        const targetFilePath = path.join(basePath, locale, relativePath);

        console.log(`\n[${currentProgress}/${totalToProcess}] ${locale}/${relativePath}`);

        const result = await processTranslation({
          baseJSON,
          targetLocale: locale,
          baseLocale,
          targetFilePath,
          chunkSize,
          model,
          context,
          OPENAI_API_KEY,
        });

        handleResult(result);

        const statusText = !result.modified
          ? "Já sincronizado"
          : `Atualizado (+${result.keysAdded}${result.keysRemoved ? ` / -${result.keysRemoved}` : ""})`;

        console.log(`- **${locale}:** ${locale}/${relativePath} - ${statusText} total ${result.finalTotal}/${result.baseTotal}`);

        fileDetails[relativePath].push({
          locale,
          targetPath: `${locale}/${relativePath}`,
          modified: result.modified,
          keysAdded: result.keysAdded,
          keysRemoved: result.keysRemoved,
          baseTotal: result.baseTotal,
          finalTotal: result.finalTotal,
        });
      }
    }
  }

  if (isFileMode) {
    const baseJSON = await fs.readJson(baseLocaleFile);
    const fileName = `${baseLocale}.json`;
    fileDetails[fileName] = [];

    for (const locale of targetLocales) {
      if (locale === baseLocale) continue;
      currentProgress++;

      const targetFilePath = path.join(basePath, `${locale}.json`);

      console.log(`\n[${currentProgress}/${totalToProcess}] ${locale}.json`);

      const result = await processTranslation({
        baseJSON,
        targetLocale: locale,
        baseLocale,
        targetFilePath,
        chunkSize,
        model,
        context,
        OPENAI_API_KEY,
      });

      handleResult(result);

      const statusText = !result.modified
        ? "Já sincronizado"
        : `Atualizado (+${result.keysAdded}${result.keysRemoved ? ` / -${result.keysRemoved}` : ""})`;

      console.log(`- **${locale}:** ${locale}.json - ${statusText} total ${result.finalTotal}/${result.baseTotal}`);

      fileDetails[fileName].push({
        locale,
        targetPath: `${locale}.json`,
        modified: result.modified,
        keysAdded: result.keysAdded,
        keysRemoved: result.keysRemoved,
        baseTotal: result.baseTotal,
        finalTotal: result.finalTotal,
      });
    }
  }

  const executionTime = ((Date.now() - startedAt.getTime()) / 1000).toFixed(2) + "s";

  if (reportOptions?.enabled) {
    const markdown = generateSummaryMarkdown({
      startedAt,
      baseLocale,
      basePath,
      model,
      chunkSize,
      totalBaseFiles,
      totalLocales: targetLocales.length,
      totalFilesProcessed,
      totalAIRequests,
      totalModifiedFiles,
      totalSyncedFiles,
      totalKeysAdded,
      totalKeysRemoved,
      executionTime,
      details: fileDetails,
    });

    console.log("\n\n" + markdown);
    await saveSummary(markdown, reportOptions.outputPath);
  }
}