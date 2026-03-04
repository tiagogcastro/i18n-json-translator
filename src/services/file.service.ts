import { EnsureLocaleFile } from '@/types';
import fs from "fs-extra";
import path from "path";

export const ensureLocaleFile = async ({
  basePath,
  locale,
  fileName,
}: EnsureLocaleFile) => {
  const dir = path.join(basePath, locale);
  await fs.ensureDir(dir);

  const filePath = path.join(dir, fileName);

  if (!(await fs.pathExists(filePath))) {
    await fs.writeJson(filePath, {}, { spaces: 2 });
  }

  return filePath;
};

export const readJSON = async ({ filePath }: { filePath: string }) => {
  return fs.readJson(filePath);
};

export const writeJSON = async ({
  filePath,
  data,
}: {
  filePath: string;
  data: any;
}) => {
  await fs.writeJson(filePath, data, { spaces: 2 });
};