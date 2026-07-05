import Link from 'next/link';
import { type Session } from '@/lib/conference';

export default function SessionCard({ session, paperCount }: { session: Session; paperCount: number }) {
  return <article className="card session-card"><div className="session-time"><b>{session.time.split('~')[0]}</b><span>{session.time.split('~')[1]}</span></div><div className="session-body"><div className="badges"><span className="badge live-badge">{session.category}</span></div><h3 className="paper-title"><Link href={`/sessions/${session.id}`}>{session.title}</Link></h3><p className="session-place">⌖ {session.venue}</p>{paperCount > 0 && <p className="meta">좌장 {session.chair} · 발표 {paperCount}건</p>}</div><Link className="chevron" href={`/sessions/${session.id}`} aria-label={`${session.title} 세션 보기`}>›</Link></article>;
}
