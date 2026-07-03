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
import { announcements, dayLabel, papers, sessions, speakers, venues, type Paper } from '@/lib/conference';
import { parseMockNow, upcomingSessionsAt, type MockNow } from '@/lib/dashboard-time';

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
  const dates = [...new Set(sessions.map((session) => session.date))];
  const today = mockNow?.date ?? localDateKey();
  const conferenceStart = dates[0];
  const conferenceEnd = dates[dates.length - 1];
  const isBeforeConference = today < conferenceStart;
  const isAfterConference = today > conferenceEnd;
  const daysUntilConference = isBeforeConference ? daysBetween(today, conferenceStart) : 0;
  const dashboardDate = dates.includes(today) ? today : dates[0];
  const isConferenceDay = dates.includes(today);
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
    setMockNow(parseMockNow(new URLSearchParams(window.location.search).get('mockNow')));
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
  const simulatedUpcomingSessions = mockNow ? upcomingSessionsAt(sessions, mockNow.instant) : dashboardSessions;
  const simulatedDashboardSessions = mockNow ? simulatedUpcomingSessions : dashboardSessions;
  const favoritePreview = myPapers.slice(0, 3);
  const unreadCount = announcements.filter((announcement) => !readAnnouncements.includes(announcement.id)).length;

  const markAnnouncementRead = (id: string) => setReadAnnouncements((current) => {
    if (current.includes(id)) return current;
    const next = [...current, id];
    localStorage.setItem(readAnnouncementKey, JSON.stringify(next));
    return next;
  });

  const showPapers = (items: Paper[]) => <div className="list paper-list">{items.map((paper) => <PaperCard key={paper.id} paper={paper} saved={saved.includes(paper.id)} onToggle={toggle}/>)}</div>;
  const changeTab = (id: TabId) => {
    setTab(id);
    if (id !== 'search') setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const runRecentSearch = (value: string) => {
    setQuery(value);
    changeTab('search');
  };
  const showFirstDayProgram = () => {
    setDate(conferenceStart);
    changeTab('program');
  };

  return <main className="shell app-shell"><Header/>
    {tab === 'today' && <section className="today-dashboard">
      <div className="today-greeting"><div><span>VERSION 0.3</span><h1>오늘의 학술대회</h1><p>{isConferenceDay ? `${dayLabel(today)} 일정` : isAfterConference ? '행사 종료' : `${dayLabel(dashboardDate)} 행사 미리보기`}</p></div><div className="today-date"><b>{Number(today.slice(8, 10))}</b><span>{new Date(`${today}T00:00:00+09:00`).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', weekday: 'short' })}</span></div></div>
      {mockNow && <div className="mock-time-badge">Mock time: {mockNow.label}</div>}
      {isBeforeConference && <section className="conference-status-card before-conference"><div className="conference-status-meta"><time>{formatKoreanDate(today)}</time><strong>D-{daysUntilConference}</strong></div><span>CONFERENCE COUNTDOWN</span><h2>2026년도 춘계 소음진동 학술대회</h2><p>첫 행사일 프로그램을 미리 확인해 보세요.</p><button type="button" onClick={showFirstDayProgram}>첫 행사일 프로그램 보기</button></section>}
      {isAfterConference && <section className="conference-status-card after-conference"><span>CONFERENCE ARCHIVE</span><h2>학술대회가 종료되었습니다.</h2><p>프로그램과 초록은 계속 열람할 수 있습니다.</p></section>}
      <NotificationManager favoriteIds={saved}/>
      {!isAfterConference && <><div className="dashboard-section"><div className="dashboard-heading"><div><span>NOW & NEXT</span><h2>{isConferenceDay ? '오늘의 세션' : '예정 세션'}</h2></div><button onClick={() => changeTab('program')}>전체 보기</button></div><div className="dashboard-sessions">{simulatedDashboardSessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} paperCount={papers.filter((paper) => paper.sessionId === session.id).length}/>)}{mockNow && simulatedDashboardSessions.length === 0 && <div className="compact-empty">예정된 세션이 없습니다.</div>}</div></div>
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>UPCOMING</span><h2>다가오는 일정</h2></div></div><div className="upcoming-list">{simulatedUpcomingSessions.slice(0, 4).map((session) => <Link href={`/sessions/${session.id}`} key={session.id}><time>{session.time.split('~')[0]}</time><div><b>{session.title}</b><small>{session.venue}</small></div><span>›</span></Link>)}{mockNow && simulatedUpcomingSessions.length === 0 && <div className="compact-empty">다가오는 일정이 없습니다.</div>}</div></div></>}
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>MY PICKS</span><h2>즐겨찾기 논문</h2></div><button onClick={() => changeTab('my')}>내 일정</button></div>{favoritePreview.length ? showPapers(favoritePreview) : <button className="compact-empty" onClick={() => changeTab('papers')}>☆ 관심 논문을 저장하면 여기에 표시됩니다.</button>}</div>
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>RECENT</span><h2>최근 검색</h2></div></div>{recentSearches.length ? <div className="recent-chips">{recentSearches.map((item) => <button key={item} onClick={() => runRecentSearch(item)}>⌕ {item}</button>)}</div> : <button className="compact-empty" onClick={() => changeTab('search')}>⌕ 아직 최근 검색이 없습니다.</button>}</div>
      <div className="dashboard-section"><div className="dashboard-heading"><div><span>ANNOUNCEMENTS</span><h2>공지사항 {unreadCount > 0 && <i>{unreadCount}</i>}</h2></div><Link href="/notices">전체 보기</Link></div><div className="announcement-list">{announcements.slice(0, 3).map((announcement) => <button className={readAnnouncements.includes(announcement.id) ? 'read' : ''} key={announcement.id} onClick={() => markAnnouncementRead(announcement.id)}><span>{announcement.category}</span><div><b>{announcement.title}</b><small>{announcement.body}</small></div>{!readAnnouncements.includes(announcement.id) && <em/>}</button>)}</div></div>
    </section>}

    {tab === 'program' && <section><div className="screen-title"><div><span>CONFERENCE AGENDA</span><h1>프로그램</h1></div></div><div className="date-strip">{dates.map((item) => <button key={item} className={date === item ? 'active' : ''} onClick={() => setDate(item)}><small>{dayLabel(item).split(' ')[1]}요일</small><b>{new Date(`${item}T00:00:00`).getDate()}</b><span>5월</span></button>)}</div><div className="agenda-summary"><b>{dayLabel(date)} 일정</b><span>{sessions.filter((session) => session.date === date).length}개 세션</span></div><div className="program-timeline">{sessions.filter((session) => session.date === date).map((session) => <TimelineSession key={session.id} session={session} sessionPapers={papers.filter((paper) => paper.sessionId === session.id)} favorites={saved} onToggle={toggle}/>)}</div></section>}

    {tab === 'papers' && <section><div className="screen-title"><div><span>DISCOVER</span><h1>발표 논문</h1></div><strong>{filtered.length}</strong></div><SearchBar value={query} onChange={setQuery}/><div className="filter-chips"><button className="active">전체</button><button>구두 발표</button><button>포스터</button><button>저장됨</button></div>{showPapers(filtered)}</section>}

    {tab === 'search' && <section className="search-screen"><div className="screen-title"><div><span>FIND ANYTHING</span><h1>통합 검색</h1></div></div><SearchBar value={query} onChange={setQuery} placeholder="논문, 저자, 발표자, 세션, 장소 검색"/><p className="search-hint">{normalizedQuery ? `‘${query.trim()}’ 통합 검색 결과 ${totalResults}건` : '관심 있는 키워드나 발표자 이름을 검색하세요.'}</p>{normalizedQuery && <>{matchedSpeakers.length > 0 && <div className="search-group"><h2>발표자 <span>{matchedSpeakers.length}</span></h2>{matchedSpeakers.map((speaker) => <Link className="result-row" href={`/speakers/${speaker.id}`} key={speaker.id}><span className="mini-avatar">{speaker.name.slice(0, 1)}</span><div><b>{speaker.name}</b><small>발표 {speaker.papers.length}건</small></div><em>›</em></Link>)}</div>}{matchedSessions.length > 0 && <div className="search-group"><h2>세션 <span>{matchedSessions.length}</span></h2>{matchedSessions.map((session) => <Link className="result-row" href={`/sessions/${session.id}`} key={session.id}><span className="result-icon">▦</span><div><b>{session.title}</b><small>{dayLabel(session.date)} · {session.time} · {session.venue}</small></div><em>›</em></Link>)}</div>}{filtered.length > 0 && <div className="search-group"><h2>논문 <span>{filtered.length}</span></h2>{showPapers(filtered)}</div>}{totalResults === 0 && <div className="empty"><span>⌕</span><b>검색 결과가 없습니다</b><p>다른 제목, 발표자 또는 장소를 검색해 보세요.</p></div>}</>}</section>}

    {tab === 'my' && <section><div className="screen-title"><div><span>MY CONFERENCE</span><h1>내 일정</h1></div><strong>{myPapers.length}</strong></div><NotificationManager favoriteIds={saved}/>{myPapers.length ? <>{todayFavorites.length > 0 && <div className="saved-day today-saved"><h2>오늘 <span>{todayFavorites.length}</span></h2>{showPapers(todayFavorites)}</div>}{dates.map((item) => { const items = myPapers.filter((paper) => paper.date === item && paper.date !== today); return items.length ? <div key={item} className="saved-day"><h2>{dayLabel(item)} <span>{items.length}</span></h2>{showPapers(items)}</div> : null; })}</> : <div className="empty schedule-empty"><span>☆</span><b>나만의 일정을 만들어 보세요</b><p>논문 카드의 별표를 누르면 날짜별 일정과 발표 알림을 한곳에서 관리할 수 있습니다.</p><button onClick={() => changeTab('papers')}>논문 둘러보기</button></div>}</section>}

    {tab === 'more' && <section><div className="screen-title"><div><span>INFORMATION</span><h1>더보기</h1></div></div><div className="more-menu"><Link href="/notices"><span>●</span><div><b>공지사항</b><small>학술대회 최신 안내</small></div>{unreadCount > 0 ? <i>{unreadCount}</i> : '›'}</Link><Link href="/venues"><span>⌖</span><div><b>발표장 안내</b><small>{venues.length}개 장소</small></div>›</Link><Link href="/sponsors"><span>◇</span><div><b>후원사</b><small>함께하는 파트너</small></div>›</Link></div><div className="venue-preview">{venues.slice(0, 3).map((venue) => <VenueCard key={venue.id} venue={venue} sessionCount={sessions.filter((session) => session.venue === venue.name).length}/>)}</div></section>}
    <Tabs active={tab} onChange={changeTab} bottom/>
  </main>;
}
