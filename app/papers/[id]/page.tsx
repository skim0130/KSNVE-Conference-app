import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import PaperActions from '@/components/PaperActions';
import { dayLabel, papers, sessions } from '@/lib/conference';

export function generateStaticParams(){ return papers.map(p=>({id:p.id})); }
export default async function PaperDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params; const paper=papers.find(p=>p.id===id); if(!paper) notFound(); const session=sessions.find(s=>s.id===paper.sessionId);
  return <main className="shell detail-shell paper-detail"><Header compact/><Link href="/" className="back">‹ 프로그램으로 돌아가기</Link><article className="detail-card"><span className="paper-type">ORAL PRESENTATION · {paper.id.toUpperCase()}</span><h1>{paper.title}</h1><div className="presenter"><span>{paper.presenter.slice(0,1)}</span><div><small>발표자</small><b>{paper.presenter}</b><p>{paper.authors}</p></div></div><PaperActions id={paper.id}/><section className="schedule-panel"><div><span>▣</span><p><small>일시</small><b>{dayLabel(paper.date)} · {paper.time}</b></p></div><div><span>⌖</span><p><small>발표장</small><b>{paper.venue}</b></p></div></section><dl className="details"><div><dt>세션</dt><dd>{session?<Link className="text-link" href={`/sessions/${session.id}`}>{session.title} ›</Link>:paper.session}</dd></div><div><dt>좌장</dt><dd>{session?.chair||'-'}</dd></div></dl><section className="abstract"><h2>초록</h2><p>학술대회 초록집의 상세 내용이 준비되는 대로 이 화면에서 확인할 수 있습니다.</p></section></article></main>;
}
