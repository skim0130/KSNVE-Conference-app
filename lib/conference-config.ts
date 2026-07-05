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

// The spring JSON contains the paper sessions only. Keep the source file
// unchanged and supply the official program-book events at runtime, mapped to
// the fall-test dates.
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
  {
    id: 's055',
    title: '전시부스 투어',
    date: '2026-11-25',
    day: '수',
    time: '15:40~16:00',
    venue: '1층 로비',
    chair: '-',
    category: '전시 행사',
  },
  {
    id: 's056',
    title: '웰컴리셉션',
    date: '2026-11-25',
    day: '수',
    time: '18:00~',
    venue: '그랜드볼룸[1]',
    chair: '-',
    category: '공식 행사',
  },
  {
    id: 's057',
    title: '전시부스 투어',
    date: '2026-11-26',
    day: '목',
    time: '10:20~10:40',
    venue: '1층 로비',
    chair: '-',
    category: '전시 행사',
  },
  {
    id: 's058',
    title: '포스터 발표 [1]',
    date: '2026-11-26',
    day: '목',
    time: '13:00~13:40',
    venue: 'B1층 로비',
    chair: '-',
    category: '포스터 발표',
  },
  {
    id: 's059',
    title: '전시부스 투어',
    date: '2026-11-26',
    day: '목',
    time: '15:00~15:20',
    venue: '1층 로비',
    chair: '-',
    category: '전시 행사',
  },
  {
    id: 's060',
    title: '개회식',
    date: '2026-11-26',
    day: '목',
    time: '17:00~17:10',
    venue: '에메랄드홀',
    chair: '-',
    category: '공식 행사',
  },
  {
    id: 's061',
    title: '초청특별강연 - 세계속의 K-원전 (장희승)',
    date: '2026-11-26',
    day: '목',
    time: '17:10~17:50',
    venue: '에메랄드홀',
    chair: '-',
    category: '초청특별강연',
  },
  {
    id: 's062',
    title: '만찬',
    date: '2026-11-26',
    day: '목',
    time: '18:00~',
    venue: '그랜드볼룸',
    chair: '-',
    category: '공식 행사',
  },
  {
    id: 's063',
    title: '전시부스 투어',
    date: '2026-11-27',
    day: '금',
    time: '10:00~10:40',
    venue: '1층 로비',
    chair: '-',
    category: '전시 행사',
  },
  {
    id: 's064',
    title: '학생 멘토링 세션',
    date: '2026-11-26',
    day: '목',
    time: '15:20~16:40',
    venue: '오팔홀[2]',
    chair: '이승철',
    category: '학생 멘토링',
  },
] as const;

export function mapSpringConferenceTextToFall(value: string) {
  return value
    .replaceAll('춘계학술대회', '추계학술대회')
    .replaceAll('쏠비치 삼척', conferenceConfig.venue)
    .replaceAll('삼척역', '여수엑스포역');
}
