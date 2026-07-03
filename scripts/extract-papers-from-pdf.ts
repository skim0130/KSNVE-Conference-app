import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import programPapers from '../data/papers.json';
import sessions from '../data/sessions.json';
import { paperToXml, writeJson, type ExtractedPaper } from './paper-xml-utils';

type ProgramPaper = (typeof programPapers)[number];
type PdfPage = { page: number; lines: string[]; text: string; normalized: string };

const run = promisify(execFile);
const defaultPdf = 'source-pdf/abstract-book.pdf';
const defaultProgramPdf = 'source-pdf/program-book.pdf';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalize(value: string) {
  return value.normalize('NFC').toLocaleLowerCase('ko').replace(/[^0-9a-z가-힣]+/g, '');
}

function ngrams(value: string, size = 3) {
  const result = new Set<string>();
  for (let index = 0; index <= value.length - size; index += 1) result.add(value.slice(index, index + size));
  return result;
}

function titleScore(title: string, page: PdfPage) {
  const target = normalize(title.slice(0, 180));
  if (!target) return 0;
  if (page.normalized.includes(target)) return 1;
  const grams = ngrams(target);
  if (!grams.size) return 0;
  let hits = 0;
  for (const gram of grams) if (page.normalized.includes(gram)) hits += 1;
  return hits / grams.size;
}

type IndexEntry = { text: string; time: string; printedPage: number | null; normalized: string };

function parseIndexEntries(pages: PdfPage[]) {
  const entries: IndexEntry[] = [];
  for (const page of pages) {
    let current: string[] = [];
    const flush = () => {
      if (!current.length) return;
      const text = current.join(' ');
      const dottedPages = [...text.matchAll(/[·.]{3,}\s*(\d{2,3})(?:\D|$)/g)].map((match) => Number(match[1]));
      const fallbackPages = [...text.matchAll(/(?:^|\s)(\d{2,3})(?:\s|$)/g)].map((match) => Number(match[1])).filter((value) => value >= 50 && value <= 500);
      entries.push({ text, time: current[0].slice(0, 11), printedPage: dottedPages[0] ?? fallbackPages.at(-1) ?? null, normalized: normalize(text) });
      current = [];
    };
    for (const line of page.lines) {
      if (/^\d{2}:\d{2}[~–-]\d{2}:\d{2}/.test(line)) flush();
      if (current.length || /^\d{2}:\d{2}[~–-]\d{2}:\d{2}/.test(line)) current.push(line);
    }
    flush();
  }
  return entries;
}

function entryScore(paper: ProgramPaper, entry: IndexEntry) {
  const title = normalize(paper.title.slice(0, 180));
  const grams = ngrams(title);
  let hits = 0;
  for (const gram of grams) if (entry.normalized.includes(gram)) hits += 1;
  const titlePart = grams.size ? hits / grams.size : 0;
  const presenterPart = entry.normalized.includes(normalize(paper.presenter)) ? 0.18 : 0;
  const timePart = entry.time === paper.time ? 0.12 : 0;
  return titlePart + presenterPart + timePart;
}

function sourcePageMap(pages: PdfPage[]) {
  const result = new Map<number, number>();
  for (const page of pages) {
    const printed = [...page.text.matchAll(/-\s*(\d{1,3})\s*-/g)].map((match) => Number(match[1])).at(-1);
    if (printed) result.set(printed, page.page);
  }
  return result;
}

async function extractPages(pdfPath: string): Promise<PdfPage[]> {
  const bytes = new Uint8Array(await fs.readFile(pdfPath));
  const loadingTask = getDocument({ data: bytes });
  const document = await loadingTask.promise;
  const pages: PdfPage[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item && 'transform' in item)
      .map((item) => ({ text: item.str.normalize('NFC').trim(), x: item.transform[4], y: item.transform[5] }))
      .filter((item) => item.text);
    const rows = new Map<number, typeof items>();
    for (const item of items) {
      const key = Math.round(item.y * 2) / 2;
      const row = rows.get(key) ?? [];
      row.push(item);
      rows.set(key, row);
    }
    const lines = [...rows.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const text = lines.join('\n');
    pages.push({ page: pageNumber, lines, text, normalized: normalize(text) });
    if (pageNumber % 25 === 0 || pageNumber === document.numPages) console.log(`Read PDF pages: ${pageNumber}/${document.numPages}`);
  }
  await loadingTask.destroy();
  return pages;
}

function findBestEntry(paper: ProgramPaper, entries: IndexEntry[]) {
  let best: { entry: IndexEntry; score: number } | undefined;
  for (const entry of entries) {
    const score = entryScore(paper, entry);
    if (!best || score > best.score) best = { entry, score };
  }
  return best && best.score >= 0.42 && best.entry.printedPage ? best : undefined;
}

function deriveAffiliations(authors: string, lines: string[], abstractIndex: number) {
  const values = new Set<string>();
  for (const match of authors.matchAll(/\(([^)]+)\)/g)) match[1].split(/[,;/]/).map((value) => value.trim()).filter(Boolean).forEach((value) => values.add(value));
  const affiliationWords = /(대학교|대학|연구원|연구소|University|Institute|Corporation|전자|자동차|공사)/i;
  lines.slice(0, Math.max(abstractIndex, 0)).filter((line) => affiliationWords.test(line) && line.length < 180).forEach((line) => values.add(line));
  return [...values];
}

function cleanProgramMetadata(paper: ProgramPaper) {
  let title = paper.title;
  for (const session of [...sessions].sort((a, b) => b.title.length - a.title.length)) {
    if (session.title !== paper.session && title.endsWith(` ${session.title}`)) title = title.slice(0, -session.title.length).trim();
  }
  title = title
    .split(' 포스터 발표 [1]')[0]
    .split(' 1. 아래의 숙박 할인요금')[0]
    .trim();
  let authors = paper.authors;
  if (paper.id === 'p114') authors = authors.split(' 류태광')[0].trim();
  if (paper.id === 'p248') authors = authors.split(' (학회 행사장)')[0].trim();
  return { title, authors };
}

function contentFromOcr(paper: ProgramPaper, ocrText: string) {
  const lines = ocrText.normalize('NFC').split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const keywordIndex = lines.findIndex((line) => /key\s*words?|핵심어|주제어/i.test(line));
  const endIndex = lines.findIndex((line, index) => index > keywordIndex && /^(fig\.?|그림|교신저자|e-?mail|감사의\s*글|후\s*기|acknowledg|참고문헌|references?)/i.test(line));
  const abstractEnd = endIndex > keywordIndex ? endIndex : lines.length;
  const abstract = keywordIndex >= 0 ? lines.slice(keywordIndex + 1, abstractEnd).join(' ').replace(/\s+/g, ' ').trim() : '';
  const keywordLine = keywordIndex >= 0 ? lines[keywordIndex].replace(/^.*?(?:key\s*words?|핵심어|주제어)\s*[:：]?\s*/i, '') : '';
  const keywords = keywordLine.split(/[,;·]/).map((value) => value.trim()).filter(Boolean);
  return { abstract, keywords, affiliations: deriveAffiliations(paper.authors, lines, keywordIndex) };
}

async function renderAndOcr(pdfPath: string, physicalPages: number[]) {
  if (!physicalPages.length) return new Map<number, string>();
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ksnve-paper-ocr-'));
  const minimum = Math.min(...physicalPages);
  const maximum = Math.max(...physicalPages);
  const outputPattern = path.join(temporary, 'page-%03d.png');
  const gs = process.env.GS_BIN ?? '/opt/homebrew/bin/gs';
  const tesseract = process.env.TESSERACT_BIN ?? '/opt/homebrew/bin/tesseract';
  console.log(`Rendering PDF pages ${minimum}-${maximum} for Korean OCR...`);
  await run(gs, ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pnggray', '-r220', `-dFirstPage=${minimum}`, `-dLastPage=${maximum}`, `-sOutputFile=${outputPattern}`, pdfPath], { maxBuffer: 10 * 1024 * 1024 });
  const rendered = (await fs.readdir(temporary)).filter((file) => file.endsWith('.png')).sort();
  const pageToImage = new Map<number, string>();
  rendered.forEach((file, index) => pageToImage.set(minimum + index, path.join(temporary, file)));
  const wanted = [...new Set(physicalPages)].sort((a, b) => a - b);
  const result = new Map<number, string>();
  let cursor = 0;
  const workers = Array.from({ length: Math.min(4, wanted.length) }, async () => {
    while (cursor < wanted.length) {
      const index = cursor;
      cursor += 1;
      const page = wanted[index];
      const image = pageToImage.get(page);
      if (!image) continue;
      const { stdout } = await run(tesseract, [image, 'stdout', '-l', 'kor+eng', '--psm', '6'], { maxBuffer: 20 * 1024 * 1024 });
      result.set(page, stdout);
      if ((index + 1) % 20 === 0 || index + 1 === wanted.length) console.log(`OCR pages: ${index + 1}/${wanted.length}`);
    }
  });
  await Promise.all(workers);
  await fs.rm(temporary, { recursive: true, force: true });
  return result;
}

async function main() {
  const pdfPath = path.resolve(argument('--input') ?? defaultPdf);
  const programPdfPath = path.resolve(argument('--program') ?? defaultProgramPdf);
  const outputRoot = path.resolve(argument('--output') ?? '.paper-extraction/latest');
  try {
    await fs.access(pdfPath);
    await fs.access(programPdfPath);
  } catch {
    throw new Error(`Input PDFs not found. Expected ${pdfPath} and ${programPdfPath}. Existing app data was not modified.`);
  }

  const pages = await extractPages(pdfPath);
  const programPages = await extractPages(programPdfPath);
  const firstAbstractPage = pages.find((page) => /key\s*words?/i.test(page.text))?.page ?? 74;
  const entries = parseIndexEntries(pages.filter((page) => page.page < firstAbstractPage));
  const printedToPhysical = sourcePageMap(pages);
  const programMatches = programPapers.filter((paper) => {
    const metadata = cleanProgramMetadata(paper);
    return programPages.some((page) => titleScore(metadata.title, page) >= 0.48);
  }).length;
  const resolvedPages = new Map<string, { physical: number; printed: number; score: number }>();
  for (const paper of programPapers) {
    const metadata = cleanProgramMetadata(paper);
    const match = findBestEntry({ ...paper, title: metadata.title, authors: metadata.authors }, entries);
    if (!match || !match.entry.printedPage) continue;
    const physical = printedToPhysical.get(match.entry.printedPage) ?? match.entry.printedPage + (firstAbstractPage - 61);
    if (physical >= firstAbstractPage && physical <= pages.length) resolvedPages.set(paper.id, { physical, printed: match.entry.printedPage, score: match.score });
  }
  let previous = new Map<string, ExtractedPaper>();
  try {
    const records: ExtractedPaper[] = JSON.parse(await fs.readFile(path.join(outputRoot, 'papers.json'), 'utf8'));
    previous = new Map(records.map((paper) => [paper.id, paper]));
  } catch {
    previous = new Map();
  }
  const changedPages = programPapers.flatMap((paper) => {
    const match = resolvedPages.get(paper.id);
    return match && previous.get(paper.id)?.source_page !== match.physical ? [match.physical] : [];
  });
  const ocrByPage = await renderAndOcr(pdfPath, changedPages);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const xmlDirectory = path.join(outputRoot, 'papers-xml');
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(xmlDirectory, { recursive: true });

  const extracted: ExtractedPaper[] = [];
  const missingFields: Array<{ paper_id: string; fields: string[] }> = [];
  const parsingErrors: Array<{ paper_id: string; error: string }> = [];
  for (const paper of programPapers) {
    try {
      const session = sessionById.get(paper.sessionId);
      const metadata = cleanProgramMetadata(paper);
      const match = resolvedPages.get(paper.id);
      const normalizedPaper = { ...paper, title: metadata.title, authors: metadata.authors };
      const prior = previous.get(paper.id);
      const content = match && prior?.source_page === match.physical
        ? { abstract: prior.abstract, keywords: prior.keywords, affiliations: prior.affiliations }
        : match ? contentFromOcr(normalizedPaper, ocrByPage.get(match.physical) ?? '') : { abstract: '', keywords: [], affiliations: [] };
      const result: ExtractedPaper = {
        paper_id: paper.id,
        id: paper.id,
        session_id: paper.sessionId,
        sessionId: paper.sessionId,
        flags: paper.flags,
        title: metadata.title,
        authors: metadata.authors,
        affiliations: content.affiliations,
        presenter: paper.presenter,
        session: paper.session,
        date: paper.date,
        time: paper.time,
        venue: paper.venue,
        chair: session?.chair ?? '',
        abstract: content.abstract,
        keywords: content.keywords,
        source_page: match?.physical ?? null,
        pageImage: match ? `/paper-pages/${paper.id}.webp` : '',
      };
      const missing = (['title', 'authors', 'affiliations', 'presenter', 'session', 'date', 'time', 'venue', 'chair', 'abstract', 'source_page'] as const).filter((field) => Array.isArray(result[field]) ? result[field].length === 0 : !result[field]);
      if (missing.length) missingFields.push({ paper_id: paper.id, fields: missing });
      extracted.push(result);
      await fs.writeFile(path.join(xmlDirectory, `${paper.id}.xml`), paperToXml(result), 'utf8');
    } catch (error) {
      parsingErrors.push({ paper_id: paper.id, error: error instanceof Error ? error.message : String(error) });
    }
  }

  await writeJson(path.join(outputRoot, 'papers.json'), extracted);
  const report = {
    generated_at: new Date().toISOString(),
    source_pdf: pdfPath,
    program_pdf: programPdfPath,
    pdf_pages: pages.length,
    expected_papers: programPapers.length,
    xml_files_created: extracted.length,
    matched_to_source_page: extracted.filter((paper) => paper.source_page !== null).length,
    matched_in_program_pdf: programMatches,
    abstracts_extracted: extracted.filter((paper) => paper.abstract).length,
    papers_with_keywords: extracted.filter((paper) => paper.keywords.length).length,
    complete_papers: extracted.length - missingFields.length,
    missing_fields: missingFields,
    parsing_errors: parsingErrors,
  };
  await writeJson(path.join(outputRoot, 'extraction-report.json'), report);
  await fs.writeFile(path.join(outputRoot, 'extraction-report.md'), `# Paper extraction report\n\n- Source: \`${pdfPath}\`\n- PDF pages: ${pages.length}\n- Expected papers: ${programPapers.length}\n- XML files created: ${extracted.length}\n- Matched source pages: ${report.matched_to_source_page}\n- Abstracts extracted: ${report.abstracts_extracted}\n- Complete papers: ${report.complete_papers}\n- Parsing errors: ${parsingErrors.length}\n\nRun \`npm run validate:papers\` to validate. Existing app data has not been modified.\n`, 'utf8');
  console.log(`Extraction staged at ${outputRoot}`);
  console.log(`XML: ${extracted.length}, source pages: ${report.matched_to_source_page}, abstracts: ${report.abstracts_extracted}, errors: ${parsingErrors.length}`);
  if (parsingErrors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
