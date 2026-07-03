import Link from 'next/link';
import { dayLabel, type Paper } from '@/lib/conference';

export default function PaperCard({ paper, saved = false, onToggle }: { paper: Paper; saved?: boolean; onToggle?: (id: string) => void }) {
  return <article className="card paper-card"><span className="paper-type">ORAL</span>
    {onToggle && <button className="star" onClick={()=>onToggle(paper.id)} aria-label={saved ? `${paper.title} 일정에서 제거` : `${paper.title} 일정에 저장`} aria-pressed={saved}>{saved?'★':'☆'}</button>}
    <div className="paper-slot"><b>{dayLabel(paper.date)} · {paper.time}</b><span>⌖ {paper.venue}</span></div>
    <h3 className="paper-title"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h3>
    <p className="meta authors">{paper.authors}</p><p className="meta session-link"><Link href={`/sessions/${paper.sessionId}`}>{paper.session}</Link></p>
  </article>;
}
