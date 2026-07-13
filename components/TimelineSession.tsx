import Link from 'next/link';
import PaperCard from '@/components/PaperCard';
import { formatSessionTitle, type Paper, type Session } from '@/lib/conference';

export default function TimelineSession({ session, sessionPapers, favorites, onToggle }: { session: Session; sessionPapers: Paper[]; favorites: string[]; onToggle: (id: string) => void }) {
  const [start, end] = session.time.split('~');
  return <article className="agenda-session">
    <div className="agenda-time"><b>{start}</b><span>{end}</span></div>
    <div className="agenda-card">
      <span className="category-label">{formatSessionTitle(session.category)}</span>
      <h3><Link href={`/sessions/${session.id}`}>{formatSessionTitle(session.title)}</Link></h3>
      <p>⌖ {session.venue} · 좌장 {session.chair}</p>
      {sessionPapers.length > 0 && <details>
        <summary>발표 {sessionPapers.length}건 보기 <span>⌄</span></summary>
        <div className="nested-papers">{sessionPapers.map((paper) => <PaperCard key={paper.id} paper={paper} saved={favorites.includes(paper.id)} onToggle={onToggle}/>)}</div>
      </details>}
    </div>
  </article>;
}
