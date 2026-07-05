import papersData from '@/data/papers-with-abstracts.json';
import posterPapersData from '@/data/poster-papers.json';
import sessionsData from '@/data/sessions.json';
import venuesData from '@/data/venues.json';
import speakersData from '@/data/speakers.json';
import announcementsData from '@/data/announcements.json';
import { fallTestAdditionalSessions, mapSpringConferenceTextToFall, mapSpringDateToFall } from '@/lib/conference-config';

export type PaperFigure = {
  id?: string;
  caption?: string;
  image?: string;
};

export type Paper = {
  paper_id?: string;
  id: string;
  session_id?: string;
  sessionId: string;
  date: string;
  time: string;
  venue: string;
  session: string;
  chair?: string;
  flags: string;
  title: string;
  authors: string;
  presenter: string;
  affiliations?: string[] | string;
  abstract?: string;
  keywords?: string[];
  sourcePage?: number;
  extractionStatus?: string;
  figures?: { id?: string; caption?: string; image?: string }[];
  pageImage?: string;
};

export type Session = {
  id: string;
  title: string;
  date: string;
  day: string;
  time: string;
  venue: string;
  chair: string;
  category: string;
};

export type Venue = {
  id: string;
  name: string;
  floor: string;
};

export type Speaker = {
  id: string;
  name: string;
  papers: string[];
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  category: string;
};

type PaperDataRecord = Omit<Paper, 'sourcePage'> & {
  source_page?: number | null;
};

export const papers: Paper[] = ([...papersData, ...posterPapersData] as PaperDataRecord[]).map(
  ({ source_page: sourcePage, ...paper }) => ({
    ...paper,
    date: mapSpringDateToFall(paper.date),
    sourcePage: sourcePage ?? undefined,
  }),
);
export const sessions: Session[] = [
  ...(sessionsData as Session[]).map((session) => ({
    ...session,
    date: mapSpringDateToFall(session.date),
  })),
  ...fallTestAdditionalSessions,
];
export const venues = venuesData as Venue[];
export const speakers = speakersData as Speaker[];
export const announcements: Announcement[] = (announcementsData as Announcement[]).map((announcement) => ({
  ...announcement,
  title: announcement.id === 'notice-000' ? announcement.title : mapSpringConferenceTextToFall(announcement.title),
  body: announcement.id === 'notice-000' ? announcement.body : mapSpringConferenceTextToFall(announcement.body),
}));

export const dayLabel = (date: string) => {
  const labels: Record<string, string> = {
    '2026-11-25': '11/25 수',
    '2026-11-26': '11/26 목',
    '2026-11-27': '11/27 금',
    '2026-11-28': '11/28 토',
  };
  return labels[date] ?? date;
};
