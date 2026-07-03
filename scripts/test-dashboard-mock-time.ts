import sessions from '../data/sessions.json';
import { parseMockNow, upcomingSessionsAt } from '../lib/dashboard-time';

const cases = [
  { value: '2026-05-27T13:00:00', firstId: 's001', count: 53 },
  { value: '2026-05-27T14:25:00', firstId: 's006', count: 48 },
  { value: '2026-05-28T09:10:00', firstId: 's019', count: 35 },
  { value: '2026-05-29T15:00:00', firstId: null, count: 0 },
  { value: '2026-05-31T09:00:00', firstId: null, count: 0 },
];

const results = cases.map(({ value, firstId, count }) => {
  const mockNow = parseMockNow(value);
  if (!mockNow) throw new Error(`Could not parse test time: ${value}`);
  const upcoming = upcomingSessionsAt(sessions, mockNow.instant);
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
