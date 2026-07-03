'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header'; import Tabs,{type TabId} from '@/components/Tabs'; import SearchBar from '@/components/SearchBar'; import PaperCard from '@/components/PaperCard'; import SessionCard from '@/components/SessionCard'; import VenueCard from '@/components/VenueCard';
import {dayLabel,papers,sessions,venues} from '@/lib/conference';

export default function Home(){
 const dates=[...new Set(sessions.map(s=>s.date))]; const [tab,setTab]=useState<TabId>('program'); const [date,setDate]=useState(dates[0]); const [query,setQuery]=useState(''); const [saved,setSaved]=useState<string[]>([]);
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('ksnveFav')||'[]'))}catch{setSaved([])}},[]);
 const toggle=(id:string)=>setSaved(current=>{const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];localStorage.setItem('ksnveFav',JSON.stringify(next));return next});
 const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase('ko');return q?papers.filter(p=>[p.title,p.authors,p.presenter,p.session,p.venue].join(' ').toLocaleLowerCase('ko').includes(q)):papers},[query]);
 const myPapers=papers.filter(p=>saved.includes(p.id)); const showPapers=(items:typeof papers)=><div className="list paper-list">{items.map(p=><PaperCard key={p.id} paper={p} saved={saved.includes(p.id)} onToggle={toggle}/>)}</div>;
 const changeTab=(id:TabId)=>{setTab(id);if(id!=='search')setQuery('');window.scrollTo({top:0,behavior:'smooth'})};
 return <main className="shell app-shell"><Header/>
  {tab==='program'&&<section><div className="screen-title"><div><span>CONFERENCE AGENDA</span><h1>프로그램</h1></div><button aria-label="프로그램 필터">≡</button></div><div className="date-strip">{dates.map(d=><button key={d} className={date===d?'active':''} onClick={()=>setDate(d)}><small>{dayLabel(d).split(' ')[1]}요일</small><b>{new Date(`${d}T00:00:00`).getDate()}</b><span>5월</span></button>)}</div><div className="agenda-summary"><b>{dayLabel(date)} 일정</b><span>{sessions.filter(s=>s.date===date).length}개 세션</span></div><div className="timeline">{sessions.filter(s=>s.date===date).map(s=><SessionCard key={s.id} session={s} paperCount={papers.filter(p=>p.sessionId===s.id).length}/>)}</div></section>}
  {tab==='papers'&&<section><div className="screen-title"><div><span>DISCOVER</span><h1>발표 논문</h1></div><strong>{filtered.length}</strong></div><SearchBar value={query} onChange={setQuery}/><div className="filter-chips"><button className="active">전체</button><button>구두 발표</button><button>포스터</button><button>저장됨</button></div>{showPapers(filtered)}</section>}
  {tab==='search'&&<section className="search-screen"><div className="screen-title"><div><span>FIND ANYTHING</span><h1>통합 검색</h1></div></div><SearchBar value={query} onChange={setQuery} placeholder="논문, 저자, 발표자, 세션, 장소 검색"/><p className="search-hint">{query?`‘${query}’ 검색 결과 ${filtered.length}건`:'관심 있는 키워드나 발표자 이름을 검색하세요.'}</p>{query&&showPapers(filtered)}</section>}
  {tab==='my'&&<section><div className="screen-title"><div><span>MY CONFERENCE</span><h1>내 일정</h1></div><strong>{myPapers.length}</strong></div><div className="schedule-notice">★ 저장한 발표는 이 기기에 안전하게 보관됩니다.</div>{myPapers.length?dates.map(d=>{const items=myPapers.filter(p=>p.date===d);return items.length?<div key={d} className="saved-day"><h2>{dayLabel(d)}</h2>{showPapers(items)}</div>:null}):<div className="empty"><span>☆</span><b>나만의 일정을 만들어 보세요</b><p>논문이나 세션의 별표를 누르면 이곳에 모아볼 수 있습니다.</p><button onClick={()=>changeTab('papers')}>논문 둘러보기</button></div>}</section>}
  {tab==='more'&&<section><div className="screen-title"><div><span>INFORMATION</span><h1>더보기</h1></div></div><div className="more-menu"><Link href="/notices"><span>●</span><div><b>공지사항</b><small>학술대회 최신 안내</small></div>›</Link><div><span>⌖</span><div><b>발표장 안내</b><small>{venues.length}개 장소</small></div></div><Link href="/sponsors"><span>◇</span><div><b>후원사</b><small>함께하는 파트너</small></div>›</Link></div><div className="venue-preview">{venues.slice(0,3).map(v=><VenueCard key={v.id} venue={v} sessionCount={sessions.filter(s=>s.venue===v.name).length}/>)}</div></section>}
  <Tabs active={tab} onChange={changeTab} bottom/>
 </main>
}
