import { GetAllJsonFilesFromLocaleRequest } from '@/types';
import fs from "fs-extra";
import path from "path";

export const getAllJsonFilesFromLocale = async ({
  basePath,
  locale,
}: GetAllJsonFilesFromLocaleRequest): Promise<string[]> => {
  const localePath = path.join(basePath, locale);
  const files: string[] = [];

  const scan = async (dir: string) => {
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (entry.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  };

  await scan(localePath);

  return files;
};