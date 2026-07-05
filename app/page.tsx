'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Tabs, { type TabId } from '@/components/Tabs';
import SearchBar from '@/components/SearchBar';
import PaperCard from '@/components/PaperCard';
import SessionCard from '@/components/SessionCard';
import VenueCard from '@/components/VenueCard';
import TimelineSession from '@/components/TimelineSession';
import NotificationManager from '@/components/NotificationManager';
import { announcements, dayLabel, papers, sessions, speakers, venues, type Paper, type Session } from '@/lib/conference';
import { conferenceConfig } from '@/lib/conference-config';
import { parseMockNow, type MockNow } from '@/lib/dashboard-time';

const favoriteKey = 'ksnveFav';
const recentSearchKey = 'ksnveRecentSearches';
const readAnnouncementKey = 'ksnveReadAnnouncements';

function localDateKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formatKoreanDate(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function groupSessionsByStart(items: Session[]) {
  return items.reduce<Array<{ key: string; time: string; sessions: Session[] }>>((groups, session) => {
    const time = session.time.split('~')[0];
    const key = `${session.date}-${time}`;
    const group = groups.find((item) => item.key === key);
    if (group) group.sessions.push(session);
    else groups.push({ key, time, sessions: [session] });
    return groups;
  }, []);
}

function sessionRange(session: Session) {
  const [start, end] = session.time.split(/[~–-]/);
  const startsAt = new Date(`${session.date}T${start}:00+09:00`).getTime();
  return {
    start: startsAt,
    end: end ? new Date(`${session.date}T${end}:00+09:00`).getTime() : startsAt + 2 * 60 * 60 * 1000,
  };
}

function currentOrNextSessions(items: Session[], date: string, now: Date) {
  const datedSessions = items.filter((session) => session.date === date);
  const nowTime = now.getTime();
  const running = datedSessions.filter((session) => {
    const range = sessionRange(session);
    return range.start <= nowTime && nowTime < range.end;
  });
  if (running.length > 0) return running;

  const upcoming = datedSessions.filter((session) => sessionRange(session).start > nowTime);
  if (upcoming.length === 0) return [];
  const nearestStart = Math.min(...upcoming.map((session) => sessionRange(session).start));
  return upcoming.filter((session) => sessionRange(session).start === nearestStart);
}

const majorEventPattern = /개회|개막|기조|plenary|특별\s*강연|총회|시상|만찬|웰컴|전시부스\s*투어|폐회|폐막|대토론회|정보\s*교류회/i;

function isMajorEvent(session: Session) {
  return majorEventPattern.test(`${session.title} ${session.category}`);
}

function readLocalList(key: string) {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [mockNow, setMockNow] = useState<MockNow | null>(null);
  const dates = [...conferenceConfig.dates];
  const today = mockNow?.date ?? localDateKey();
  const conferenceStart = conferenceConfig.startDate;
  const conferenceEnd = conferenceConfig.endDate;
  const isBeforeConference = today < conferenceStart;
  const isAfterConference = today > conferenceEnd;
  const daysUntilConference = isBeforeConference ? daysBetween(today, conferenceStart) : 0;
  const isConferenceDay = today >= conferenceStart && today <= conferenceEnd;
  const dashboardDate = isConferenceDay ? today : conferenceStart;
  const [tab, setTab] = useState<TabId>('today');
  const [date, setDate] = useState(dashboardDate);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    setSaved(readLocalList(favoriteKey));
    setRecentSearches(readLocalList(recentSearchKey));
    setReadAnnouncements(readLocalList(readAnnouncementKey));
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab');
    if (requestedTab === 'program' || requestedTab === 'search' || requestedTab === 'my' || requestedTab === 'more') setTab(requestedTab);
    setMockNow(parseMockNow(params.get('mockNow')));
  }, []);

  const toggle = (id: string) => setSaved((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem(favoriteKey, JSON.stringify(next));
    return next;
  });

  const normalizedQuery = query.trim().toLocaleLowerCase('ko');
  const filtered = useMemo(() => normalizedQuery
    ? papers.filter((paper) => [paper.title, paper.authors, paper.presenter, paper.session, paper.venue].join(' ').toLocaleLowerCase('ko').includes(normalizedQuery))
    : papers, [normalizedQuery]);
  const matchedSessions = normalizedQuery ? sessions.filter((session) => [session.title, session.chair, session.category, session.venue].join(' ').toLocaleLowerCase('ko').includes(normalizedQuery)) : [];
  const matchedSpeakers = normalizedQuery ? speakers.filter((speaker) => speaker.name.toLocaleLowerCase('ko').includes(normalizedQuery)) : [];
  const totalResults = filtered.length + matchedSessions.length + matchedSpeakers.length;

  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const timer = window.setTimeout(() => {
      setRecentSearches((current) => {
        const next = [query.trim(), ...current.filter((item) => item.toLocaleLowerCase('ko') !== normalizedQuery)].slice(0, 5);
        localStorage.setItem(recentSearchKey, JSON.stringify(next));
        return next;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery, query]);

  const myPapers = papers.filter((paper) => saved.includes(paper.id));
  const todayFavorites = myPapers.filter((paper) => paper.date === today);
  const dashboardSessions = sessions.filter((session) => session.date === dashboardDate);
  const dashboardNow = mockNow?.instant ?? new Date();
  const currentOrNext = currentOrNextSessions(sessions, dashboardDate, dashboardNow);
  const remainingMajorEvents = dashboardSessions.filter((session) => isMajorEvent(session) && sessionRange(session).end > dashboardNow.getTime());
  const majorEventGroups = groupSessionsByStart(remainingMajorEvents);
  const unreadCount = announcements.filter((announcement) => !readAnnouncements.includes(announcement.id)).length;

  const markAnnouncementRead = (id: string) => setReadAnnouncements((current) => {
    if (current.includes(id)) return current;
    const next = [...current, id];
    localStorage.setItem(readAnnouncementKey, JSON.stringify(next));
    return next;
  });

  const showPapers = (items: Paper[]) => <div className="list paper-list">{items.map((paper) => <PaperCard key={paper.id} paper={paper} saved={saved.includes(paper.id)} onToggle={toggle}/>)}</div>;
  const changeTab = (id: TabId) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setTab(id);
    if (id !== 'search') setQuery('');
    const url = new URL(window.location.href);
    if (id === 'today') url.searchParams.delete('tab');
    else url.searchParams.set('tab', id);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const runRecentSearch = (value: string) => {
    setQuery(value);
    changeTab('search');
  };
  const removeRecentSearch = (value: string) => setRecentSearches((current) => {
    const next = current.filter((item) => item !== value);
    localStorage.setItem(recentSearchKey, JSON.stringify(next));
    return next;
  });
  const clearRecentSearches = () => {
    localStorage.setItem(recentSearchKey, '[]');
    setRecentSearches([]);
  };
  const showFirstDayProgram = () => {
    setDate(conferenceStart);
    changeTab('program');
  };

  return <main className="shell app-shell"><Header compact={tab !== 'today'}/>
    {tab === 'today' && <section className="today-dashboard">
      {mockNow && <div className="mock-time-badge">Mock time: {mockNow.label}</div>}
      {isBeforeConference && <section className="conference-status-card before-conference"><div className="conference-status-meta"><time>{formatKoreanDate(today)}</time><strong>D-{daysUntilConference}</strong></div><span>CONFERENCE COUNTDOWN</span><h2>{conferenceConfig.koreanTitle}</h2><p className="countdown-copy"><strong>학술대회가 {daysUntilConference}일 남았습니다.</strong><span>첫 행사일 프로그램을 미리 살펴보세요.</span></p><button type="button" onClick={showFirstDayProgram}>첫 행사일 프로그램 보기</button></section>}
      {isConferenceDay && <div className="conference-live-status"><span>LIVE</span><div><b>학술대회 진행 중</b><small>{formatKoreanDate(today)} · {conferenceConfig.venue}</small></div></div>}
      {isAfterConference && <section className="conference-status-card after-conference"><span>CONFERENCE ARCHIVE</span><h2>학술대회가 종료되었습니다.</h2><p>프로그램과 초록은 계속 열람할 수 있습니다.</p></section>}
      {!isAfterConference && <><div className="dashboard-section"><div className="dashboard-heading"><div><span>NOW & NEXT</span><h2>현재 진행 중 / 다음 세션</h2></div><button onClick={() => changeTab('program')}>전체 보기</button></div><div className="dashboard-sessions">{currentOrNext.map((session) => <SessionCard key={session.id} session={session} paperCount={papers.filter((paper) => paper.sessionId === session.id).length}/>)}{currentOrNext.length === 0 && <div className="compact-empty">현재 진행 중이거나 예정된 세션이 없습니다.</div>}</div></div>
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>MAJOR EVENTS</span><h2>오늘 남은 주요 일정</h2></div></div><div className="upcoming-groups">{majorEventGroups.map((group) => <section className="upcoming-group" key={group.key}><time>{group.time}</time><div>{group.sessions.map((session) => <Link href={`/sessions/${session.id}`} key={session.id}><div><b>{session.title}</b><small>{session.venue}</small></div><span>›</span></Link>)}</div></section>)}{majorEventGroups.length === 0 && <div className="compact-empty">오늘 예정된 주요 행사가 없습니다.</div>}</div></div></>}
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>ANNOUNCEMENTS</span><h2>공지사항 {unreadCount > 0 && <i>{unreadCount}</i>}</h2></div>{announcements.length > 3 && <Link href="/notices">전체 보기</Link>}</div><div className="announcement-list">{announcements.slice(0, 3).map((announcement) => <button className={readAnnouncements.includes(announcement.id) ? 'read' : ''} key={announcement.id} onClick={() => markAnnouncementRead(announcement.id)}><span>{announcement.category}</span><div><b>{announcement.title}</b><small>{announcement.body}</small></div>{!readAnnouncements.includes(announcement.id) && <em>NEW</em>}</button>)}</div></div>
    </section>}

    {tab === 'program' && <section><div className="screen-title"><div><span>CONFERENCE AGENDA</span><h1>프로그램</h1></div></div><div className="date-strip">{dates.map((item) => <button key={item} className={date === item ? 'active' : ''} onClick={() => setDate(item)}><small>{dayLabel(item).split(' ')[1]}요일</small><b>{new Date(`${item}T00:00:00`).getDate()}</b><span>{Number(item.slice(5, 7))}월</span></button>)}</div><div className="agenda-summary"><b>{dayLabel(date)} 일정</b><span>{sessions.filter((session) => session.date === date).length}개 세션</span></div><div className="program-timeline">{sessions.filter((session) => session.date === date).sort((left, right) => left.time.localeCompare(right.time)).map((session) => <TimelineSession key={session.id} session={session} sessionPapers={papers.filter((paper) => paper.sessionId === session.id)} favorites={saved} onToggle={toggle}/>)}</div></section>}

    {tab === 'papers' && <section><div className="screen-title"><div><span>DISCOVER</span><h1>발표 논문</h1></div><strong>{filtered.length}</strong></div><SearchBar value={query} onChange={setQuery}/><div className="filter-chips"><button className="active">전체</button><button>구두 발표</button><button>포스터</button><button>저장됨</button></div>{showPapers(filtered)}</section>}

    {tab === 'search' && <section className="search-screen"><div className="screen-title"><div><span>FIND ANYTHING</span><h1>통합 검색</h1></div></div><SearchBar value={query} onChange={setQuery} placeholder="논문, 저자, 발표자, 세션, 장소 검색"/><p className="search-hint">{normalizedQuery ? `‘${query.trim()}’ 통합 검색 결과 ${totalResults}건` : '관심 있는 키워드나 발표자 이름을 검색하세요.'}</p>{!normalizedQuery && <section className="recent-search-panel"><div className="recent-search-heading"><h2>최근 검색</h2>{recentSearches.length > 0 && <button type="button" onClick={clearRecentSearches}>모두 지우기</button>}</div>{recentSearches.length > 0 ? <div className="recent-search-list">{recentSearches.map((item) => <div className="recent-search-item" key={item}><button type="button" className="recent-search-text" onClick={() => runRecentSearch(item)}><span>⌕</span>{item}</button><button type="button" className="recent-search-remove" aria-label={`${item} 검색 기록 삭제`} onClick={() => removeRecentSearch(item)}>✕</button></div>)}</div> : <p className="recent-search-empty">최근 검색 기록이 없습니다.</p>}</section>}{normalizedQuery && <>{matchedSpeakers.length > 0 && <div className="search-group"><h2>발표자 <span>{matchedSpeakers.length}</span></h2>{matchedSpeakers.map((speaker) => <Link className="result-row" href={`/speakers/${speaker.id}`} key={speaker.id}><span className="mini-avatar">{speaker.name.slice(0, 1)}</span><div><b>{speaker.name}</b><small>발표 {speaker.papers.length}건</small></div><em>›</em></Link>)}</div>}{matchedSessions.length > 0 && <div className="search-group"><h2>세션 <span>{matchedSessions.length}</span></h2>{matchedSessions.map((session) => <Link className="result-row" href={`/sessions/${session.id}`} key={session.id}><span className="result-icon">▦</span><div><b>{session.title}</b><small>{dayLabel(session.date)} · {session.time} · {session.venue}</small></div><em>›</em></Link>)}</div>}{filtered.length > 0 && <div className="search-group"><h2>논문 <span>{filtered.length}</span></h2>{showPapers(filtered)}</div>}{totalResults === 0 && <div className="empty"><span>⌕</span><b>검색 결과가 없습니다</b><p>다른 제목, 발표자 또는 장소를 검색해 보세요.</p></div>}</>}</section>}

    {tab === 'my' && <section><div className="screen-title"><div><span>MY CONFERENCE</span><h1>내 일정</h1></div><strong>{myPapers.length}</strong></div><NotificationManager favoriteIds={saved}/>{myPapers.length ? <>{todayFavorites.length > 0 && <div className="saved-day today-saved"><h2>오늘 <span>{todayFavorites.length}</span></h2>{showPapers(todayFavorites)}</div>}{dates.map((item) => { const items = myPapers.filter((paper) => paper.date === item && paper.date !== today); return items.length ? <div key={item} className="saved-day"><h2>{dayLabel(item)} <span>{items.length}</span></h2>{showPapers(items)}</div> : null; })}</> : <div className="empty schedule-empty"><span>☆</span><b>나만의 일정을 만들어 보세요</b><p>논문 카드의 별표를 누르면 날짜별 일정과 발표 알림을 한곳에서 관리할 수 있습니다.</p><button onClick={() => changeTab('papers')}>논문 둘러보기</button></div>}</section>}

    {tab === 'more' && <section><div className="screen-title"><div><span>INFORMATION</span><h1>더보기</h1></div></div><div className="more-menu"><Link href="/notices"><span>●</span><div><b>공지사항</b><small>학술대회 최신 안내</small></div>{unreadCount > 0 ? <i>{unreadCount}</i> : '›'}</Link><Link href="/sponsors"><span>◇</span><div><b>후원사</b><small>함께하는 후원사</small></div>›</Link><div className="more-menu-group"><span>▤</span><div><b>학술대회 안내</b><small>행사 정보와 이용 안내</small><nav className="more-submenu" aria-label="학술대회 안내"><Link href="/conference/overview">행사개요 <em>›</em></Link><Link href="/conference/registration">등록안내 <em>›</em></Link><Link href="/conference/venue-layout">행사장 배치도 <em>›</em></Link></nav></div></div><Link href="/app-info"><span>ⓘ</span><div><b>앱 정보</b><small>서비스 안내</small></div>›</Link></div><div className="venue-section-heading"><span>발표장</span></div><div className="venue-preview">{venues.map((venue) => <VenueCard key={venue.id} venue={venue} sessionCount={sessions.filter((session) => session.venue === venue.name).length}/>)}</div></section>}
    <Tabs active={tab} onChange={changeTab} bottom/>
  </main>;
}
