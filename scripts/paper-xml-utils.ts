import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ExtractedPaper = {
  paper_id: string;
  id: string;
  session_id: string;
  sessionId: string;
  flags: string;
  title: string;
  authors: string;
  affiliations: string[];
  presenter: string;
  session: string;
  date: string;
  time: string;
  venue: string;
  chair: string;
  abstract: string;
  keywords: string[];
  source_page: number | null;
};

const scalarFields = ['paper_id', 'session_id', 'flags', 'title', 'authors', 'presenter', 'session', 'date', 'time', 'venue', 'chair', 'abstract', 'source_page'] as const;

export function escapeXml(value: string | number | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function unescapeXml(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

export function paperToXml(paper: ExtractedPaper) {
  const scalars = scalarFields.map((field) => `  <${field}>${escapeXml(paper[field])}</${field}>`).join('\n');
  const affiliations = paper.affiliations.map((value) => `    <affiliation>${escapeXml(value)}</affiliation>`).join('\n');
  const keywords = paper.keywords.map((value) => `    <keyword>${escapeXml(value)}</keyword>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<paper>\n${scalars}\n  <affiliations>\n${affiliations}\n  </affiliations>\n  <keywords>\n${keywords}\n  </keywords>\n</paper>\n`;
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? unescapeXml(match[1].trim()) : '';
}

function repeatedTags(xml: string, name: string) {
  return [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((match) => unescapeXml(match[1].trim())).filter(Boolean);
}

export function xmlToPaper(xml: string): ExtractedPaper {
  if (!xml.includes('<paper>') || !xml.includes('</paper>')) throw new Error('Missing <paper> root element');
  const paperId = tag(xml, 'paper_id');
  const sessionId = tag(xml, 'session_id');
  const sourcePage = tag(xml, 'source_page');
  return {
    paper_id: paperId,
    id: paperId,
    session_id: sessionId,
    sessionId,
    flags: tag(xml, 'flags'),
    title: tag(xml, 'title'),
    authors: tag(xml, 'authors'),
    affiliations: repeatedTags(xml, 'affiliation'),
    presenter: tag(xml, 'presenter'),
    session: tag(xml, 'session'),
    date: tag(xml, 'date'),
    time: tag(xml, 'time'),
    venue: tag(xml, 'venue'),
    chair: tag(xml, 'chair'),
    abstract: tag(xml, 'abstract'),
    keywords: repeatedTags(xml, 'keyword'),
    source_page: /^\d+$/.test(sourcePage) ? Number(sourcePage) : null,
  };
}

export async function writeJson(filePath: string, value: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function replaceDirectory(source: string, target: string) {
  const parent = path.dirname(target);
  const temporary = path.join(parent, `.${path.basename(target)}.next-${Date.now()}`);
  const backup = path.join(parent, `.${path.basename(target)}.backup-${Date.now()}`);
  await fs.cp(source, temporary, { recursive: true });
  let hadTarget = false;
  try {
    await fs.rename(target, backup);
    hadTarget = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  try {
    await fs.rename(temporary, target);
    if (hadTarget) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (hadTarget) await fs.rename(backup, target);
    throw error;
  }
}
