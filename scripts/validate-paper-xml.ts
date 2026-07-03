import { promises as fs } from 'node:fs';
import path from 'node:path';
import programPapers from '../data/papers.json';
import { replaceDirectory, writeJson, xmlToPaper, type ExtractedPaper } from './paper-xml-utils';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requiredFields: Array<keyof ExtractedPaper> = ['paper_id', 'title', 'authors', 'presenter', 'session', 'date', 'time', 'venue', 'chair'];
const extractionFields: Array<keyof ExtractedPaper> = ['affiliations', 'abstract', 'source_page'];

async function main() {
  const inputRoot = path.resolve(argument('--input') ?? '.paper-extraction/latest');
  const xmlDirectory = path.join(inputRoot, 'papers-xml');
  const promote = process.argv.includes('--promote');
  const parsingErrors: Array<{ file: string; error: string }> = [];
  const missingFields: Array<{ paper_id: string; fields: string[] }> = [];
  const extractionWarnings: Array<{ paper_id: string; fields: string[] }> = [];
  const missingPageImages: Array<{ paper_id: string; pageImage: string }> = [];
  const papers: ExtractedPaper[] = [];
  let files: string[];
  try {
    files = (await fs.readdir(xmlDirectory)).filter((file) => file.endsWith('.xml')).sort();
  } catch {
    throw new Error(`Staged XML directory not found: ${xmlDirectory}. Run npm run extract:papers first.`);
  }

  for (const file of files) {
    try {
      const paper = xmlToPaper(await fs.readFile(path.join(xmlDirectory, file), 'utf8'));
      const missing = requiredFields.filter((field) => Array.isArray(paper[field]) ? paper[field].length === 0 : !paper[field]);
      if (missing.length) missingFields.push({ paper_id: paper.paper_id || file, fields: missing });
      const warnings = extractionFields.filter((field) => Array.isArray(paper[field]) ? paper[field].length === 0 : !paper[field]);
      if (warnings.length) extractionWarnings.push({ paper_id: paper.paper_id || file, fields: warnings });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(paper.date)) parsingErrors.push({ file, error: `Invalid date: ${paper.date}` });
      if (!/^\d{2}:\d{2}[~–-]\d{2}:\d{2}$/.test(paper.time)) parsingErrors.push({ file, error: `Invalid time: ${paper.time}` });
      if (paper.source_page !== null && paper.source_page < 1) parsingErrors.push({ file, error: `Invalid source_page: ${paper.source_page}` });
      const expectedPageImage = paper.source_page === null ? '' : `/paper-pages/${paper.paper_id}.webp`;
      if (paper.pageImage !== expectedPageImage) parsingErrors.push({ file, error: `Invalid pageImage: ${paper.pageImage || '(empty)'}` });
      if (paper.pageImage) {
        try {
          await fs.access(path.resolve('public', paper.pageImage.replace(/^\//, '')));
        } catch {
          missingPageImages.push({ paper_id: paper.paper_id, pageImage: paper.pageImage });
        }
      }
      if (file !== `${paper.paper_id}.xml`) parsingErrors.push({ file, error: `Filename does not match paper_id ${paper.paper_id}` });
      papers.push(paper);
    } catch (error) {
      parsingErrors.push({ file, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const ids = papers.map((paper) => paper.paper_id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const expectedIds = new Set(programPapers.map((paper) => paper.id));
  const missingIds = [...expectedIds].filter((id) => !ids.includes(id));
  const unexpectedIds = ids.filter((id) => !expectedIds.has(id));
  const stagedJsonPath = path.join(inputRoot, 'papers.json');
  let jsonMatchesXml = false;
  try {
    const stagedJson: unknown = JSON.parse(await fs.readFile(stagedJsonPath, 'utf8'));
    jsonMatchesXml = Array.isArray(stagedJson) && JSON.stringify(stagedJson) === JSON.stringify(papers);
  } catch (error) {
    parsingErrors.push({ file: 'papers.json', error: error instanceof Error ? error.message : String(error) });
  }

  const valid = files.length === programPapers.length && papers.length === programPapers.length && missingFields.length === 0 && parsingErrors.length === 0 && missingPageImages.length === 0 && duplicates.length === 0 && missingIds.length === 0 && unexpectedIds.length === 0 && jsonMatchesXml;
  const report = {
    validated_at: new Date().toISOString(),
    valid,
    promoted: false,
    expected_papers: programPapers.length,
    xml_files: files.length,
    parsed_papers: papers.length,
    complete_papers: papers.length - missingFields.length,
    missing_fields: missingFields,
    extraction_warnings: extractionWarnings,
    page_images: papers.filter((paper) => paper.pageImage).length,
    missing_page_images: missingPageImages,
    parsing_errors: parsingErrors,
    duplicate_ids: duplicates,
    missing_ids: missingIds,
    unexpected_ids: unexpectedIds,
    json_matches_xml: jsonMatchesXml,
  };

  if (promote && valid) {
    const dataDirectory = path.resolve('data');
    await replaceDirectory(xmlDirectory, path.join(dataDirectory, 'papers-xml'));
    const nextJson = path.join(dataDirectory, `.papers-with-abstracts.json.next-${Date.now()}`);
    await fs.copyFile(stagedJsonPath, nextJson);
    await fs.rename(nextJson, path.join(dataDirectory, 'papers-with-abstracts.json'));
    report.promoted = true;
    await writeJson(path.join(dataDirectory, 'papers-extraction-report.json'), report);
  }

  await writeJson(path.join(inputRoot, 'validation-report.json'), report);
  await fs.writeFile(path.join(inputRoot, 'validation-report.md'), `# Paper XML validation report\n\n- Valid: **${valid ? 'yes' : 'no'}**\n- Expected papers: ${programPapers.length}\n- XML files: ${files.length}\n- Complete core records: ${report.complete_papers}\n- Missing required-field papers: ${missingFields.length}\n- Extraction warnings: ${extractionWarnings.length}\n- Paper page images: ${report.page_images}\n- Missing paper page images: ${missingPageImages.length}\n- Parsing errors: ${parsingErrors.length}\n- Missing IDs: ${missingIds.length}\n- Duplicate IDs: ${duplicates.length}\n- JSON matches XML: ${jsonMatchesXml ? 'yes' : 'no'}\n- Promoted to app data: ${report.promoted ? 'yes' : 'no'}\n`, 'utf8');

  console.log(`Validation ${valid ? 'PASSED' : 'FAILED'}: ${files.length}/${programPapers.length} XML files, ${missingFields.length} papers with missing fields, ${parsingErrors.length} parsing errors.`);
  if (promote && !valid) console.error('Promotion blocked. Existing data/papers.json and data/papers-xml were not modified.');
  if (!valid) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
