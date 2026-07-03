import Link from 'next/link';
import { type Venue } from '@/lib/conference';

export default function VenueCard({ venue, sessionCount }: { venue: Venue; sessionCount: number }) {
  return <article className="card venue-card"><span className="venue-icon" aria-hidden="true">⌖</span><div><h3 className="paper-title"><Link href={`/venues/${venue.id}`}>{venue.name}</Link></h3><p className="meta">진행 세션 {sessionCount}개</p></div><Link className="chevron" href={`/venues/${venue.id}`} aria-label={`${venue.name} 장소 보기`}>›</Link></article>;
}
