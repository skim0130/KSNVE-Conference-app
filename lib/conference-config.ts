export const conferenceConfig = {
  koreanTitle: '2026년도 추계 소음진동 학술대회',
  englishTitle: 'KSNVE Annual Fall Conference 2026',
  shortTitle: 'KSNVE 2026 Fall',
  headerTitle: '2026 추계 소음진동 학술대회',
  shortKoreanTitle: '추계학술대회',
  startDate: '2026-11-25',
  endDate: '2026-11-28',
  dates: ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'],
  displayDate: '2026. 11. 25.(수) ~ 28.(토)',
  venue: '여수 엑스포컨벤션센터',
  locationDisplay: 'Yeosu Expo Convention Center, Yeosu, Korea',
} as const;

// Fall-conference test only: paper/session contents still come from the spring
// dataset. Only conference metadata and dates are mapped for fall testing.
const springToFallDate: Record<string, string> = {
  '2026-05-27': '2026-11-25',
  '2026-05-28': '2026-11-26',
  '2026-05-29': '2026-11-27',
  '2026-05-30': '2026-11-28',
};

export function mapSpringDateToFall(date: string) {
  return springToFallDate[date] ?? date;
}

// The spring JSON currently omits its May 30 closing program. Keep the source
// file unchanged and supply its fall-test equivalent at runtime.
export const fallTestAdditionalSessions = [
  {
    id: 's054',
    title: '대토론회 및 각 세션별 정보 교류회',
    date: '2026-11-28',
    day: '토',
    time: '09:30~12:00',
    venue: conferenceConfig.venue,
    chair: '-',
    category: '대토론회 및 정보 교류회',
  },
] as const;

export function mapSpringConferenceTextToFall(value: string) {
  return value
    .replaceAll('춘계학술대회', '추계학술대회')
    .replaceAll('쏠비치 삼척', conferenceConfig.venue)
    .replaceAll('삼척역', '여수엑스포역');
}
