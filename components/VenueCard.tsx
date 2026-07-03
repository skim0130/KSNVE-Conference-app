import { type Venue } from '@/lib/conference';

export default function VenueCard({ venue, sessionCount }: { venue: Venue; sessionCount: number }) {
  return <article className="card venue-card"><span className="venue-icon" aria-hidden="true">⌖</span><div><h3 className="paper-title">{venue.name}</h3><p className="meta">진행 세션 {sessionCount}개</p></div></article>;
}
