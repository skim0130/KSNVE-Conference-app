import sessions from '../data/sessions.json';
import { fallTestAdditionalSessions, mapSpringDateToFall } from '../lib/conference-config';
import { parseMockNow, upcomingSessionsAt } from '../lib/dashboard-time';

const fallSessions = [
  ...sessions.map((session) => ({ ...session, date: mapSpringDateToFall(session.date) })),
  ...fallTestAdditionalSessions,
];

const cases = [
  { value: '2026-11-24T10:00:00', firstId: 's001', count: 54 },
  { value: '2026-11-25T09:00:00', firstId: 's001', count: 54 },
  { value: '2026-11-26T09:10:00', firstId: 's019', count: 36 },
  { value: '2026-11-28T09:00:00', firstId: 's054', count: 1 },
  { value: '2026-11-28T15:00:00', firstId: null, count: 0 },
  { value: '2026-11-29T09:00:00', firstId: null, count: 0 },
];

const results = cases.map(({ value, firstId, count }) => {
  const mockNow = parseMockNow(value);
  if (!mockNow) throw new Error(`Could not parse test time: ${value}`);
  const upcoming = upcomingSessionsAt(fallSessions, mockNow.instant);
  if ((upcoming[0]?.id ?? null) !== firstId || upcoming.length !== count) {
    throw new Error(`Unexpected upcoming sessions at ${value}: ${upcoming[0]?.id ?? 'none'}, ${upcoming.length}`);
  }
  return {
    mockNow: value,
    firstUpcoming: upcoming[0] ? `${upcoming[0].date} ${upcoming[0].time} ${upcoming[0].id}` : null,
    upcomingCount: upcoming.length,
  };
});

console.table(results);
