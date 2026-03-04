import { TranslationSummary } from '@/types';
import fs from "fs-extra";

export const generateSummaryMarkdown = (summary: TranslationSummary) => {
  let detailsSection = `
## 📝 Detalhes por Arquivo

*Baseado nos arquivos do diretório \`${summary.baseLocale}/\`*
`;

  for (const fileName of Object.keys(summary.details)) {
    const entries = summary.details[fileName];

    const baseTotal =
      entries.length > 0 ? entries[0].baseTotal : 0;

    detailsSection += `\n### 📄 ${fileName} (${baseTotal} chaves)\n\n`;

    for (const entry of summary.details[fileName]) {
      let statusText = "";

      if (!entry.modified) {
        statusText = "Já sincronizado";
      } else {
        const additions =
          entry.keysAdded > 0 ? `+${entry.keysAdded}` : "";
        const removals =
          entry.keysRemoved > 0 ? `-${entry.keysRemoved}` : "";

        if (additions && removals) {
          statusText = `Atualizado (${additions} / ${removals})`;
        } else {
          statusText = `Atualizado (${additions}${removals})`;
        }
      }

      detailsSection += `- **${entry.locale}:** ${entry.targetPath} - ${statusText} total ${entry.finalTotal}/${entry.baseTotal}\n`;
    }
  }

  return `# Relatório de Tradução

**Última atualização:** ${summary.startedAt.toLocaleString()}

## ⚙️ Configuração

- **Idioma base:** ${summary.baseLocale}
- **Caminho dos locales:** \`${summary.basePath}\`
- **Modelo de IA usado:** \`${summary.model}\`
- **Chunk size:** ${summary.chunkSize}

## 📊 Estatísticas Gerais

- **Arquivos base processados:** ${summary.totalBaseFiles}
- **Locales processados:** ${summary.totalLocales}
- **Total de arquivos processados:** ${summary.totalFilesProcessed}
- **Uso da IA (chamadas):** ${summary.totalAIRequests}
- **Arquivos modificados:** ${summary.totalModifiedFiles}
- **Arquivos já sincronizados antes:** ${summary.totalSyncedFiles}
- **Total de chaves adicionadas:** ${summary.totalKeysAdded}
- **Total de chaves removidas:** ${summary.totalKeysRemoved}
- **Tempo total de execução:** ${summary.executionTime}

${detailsSection}
`;
};

export const saveSummary = async (
  markdown: string,
  outputPath: string
) => {
  await fs.writeFile(outputPath, markdown);
};