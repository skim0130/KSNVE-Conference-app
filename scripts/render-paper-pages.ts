import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { paperToXml, writeJson, xmlToPaper, type ExtractedPaper } from './paper-xml-utils';

const run = promisify(execFile);

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function mapConcurrent<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await task(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function main() {
  const inputRoot = path.resolve(argument('--input') ?? '.paper-extraction/latest');
  const pdfPath = path.resolve(argument('--pdf') ?? 'source-pdf/abstract-book.pdf');
  const outputDirectory = path.resolve(argument('--output') ?? 'public/paper-pages');
  const xmlDirectory = path.join(inputRoot, 'papers-xml');
  const jsonPath = path.join(inputRoot, 'papers.json');
  const files = (await fs.readdir(xmlDirectory)).filter((file) => file.endsWith('.xml')).sort();
  const papers: ExtractedPaper[] = [];

  for (const file of files) {
    const paper = xmlToPaper(await fs.readFile(path.join(xmlDirectory, file), 'utf8'));
    paper.pageImage = paper.source_page === null ? '' : `/paper-pages/${paper.paper_id}.webp`;
    papers.push(paper);
  }

  const withSourcePage = papers.filter(
    (paper): paper is ExtractedPaper & { source_page: number } => paper.source_page !== null,
  );
  if (withSourcePage.length === 0) throw new Error('No papers contain source_page values.');

  const firstPage = Math.min(...withSourcePage.map((paper) => paper.source_page));
  const lastPage = Math.max(...withSourcePage.map((paper) => paper.source_page));
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ksnve-paper-pages-'));

  try {
    await fs.mkdir(outputDirectory, { recursive: true });
    await run('gs', [
      '-q',
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=png16m',
      '-r144',
      `-dFirstPage=${firstPage}`,
      `-dLastPage=${lastPage}`,
      `-sOutputFile=${path.join(temporaryDirectory, 'page-%d.png')}`,
      pdfPath,
    ], { maxBuffer: 1024 * 1024 });

    await mapConcurrent(withSourcePage, 8, async (paper) => {
      const renderedPage = paper.source_page - firstPage + 1;
      const pngPath = path.join(temporaryDirectory, `page-${renderedPage}.png`);
      const webpPath = path.join(outputDirectory, `${paper.paper_id}.webp`);
      await run('cwebp', ['-quiet', '-q', '82', '-metadata', 'none', pngPath, '-o', webpPath]);
    });

    for (const paper of papers) {
      await fs.writeFile(path.join(xmlDirectory, `${paper.paper_id}.xml`), paperToXml(paper), 'utf8');
    }
    await writeJson(jsonPath, papers);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }

  console.log(`Rendered ${withSourcePage.length} paper page images; ${papers.length - withSourcePage.length} papers have no source page.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
