import papersData from '@/data/papers.json';
import sessionsData from '@/data/sessions.json';
import venuesData from '@/data/venues.json';
import speakersData from '@/data/speakers.json';
import announcementsData from '@/data/announcements.json';

export type Paper = { id: string; sessionId: string; date: string; time: string; venue: string; session: string; flags: string; title: string; authors: string; presenter: string };
export type Session = { id: string; title: string; date: string; day: string; time: string; venue: string; chair: string; category: string };
export type Venue = { id: string; name: string; floor: string };
export type Speaker = { id: string; name: string; papers: string[] };
export type Announcement = { id: string; title: string; body: string; date: string; category: string };

export const papers = papersData as Paper[];
export const sessions = sessionsData as Session[];
export const venues = venuesData as Venue[];
export const speakers = speakersData as Speaker[];
export const announcements = announcementsData as Announcement[];

export const dayLabel = (date: string) => {
  const labels: Record<string, string> = {
    '2026-05-27': '5/27 수', '2026-05-28': '5/28 목',
    '2026-05-29': '5/29 금', '2026-05-30': '5/30 토',
  };
  return labels[date] ?? date;
};
