import { sessions, type Paper } from '@/lib/conference';
import { presentationTypeFor, presentationTypeMeta } from '@/lib/presentation-type';

export default function PresentationBadge({ paper, showId = false }: { paper: Paper; showId?: boolean }) {
  const session = sessions.find((item) => item.id === paper.sessionId);
  const type = presentationTypeFor(paper, session);
  const meta = presentationTypeMeta[type];
  const paperId = (paper.paper_id || paper.id).toUpperCase();

  return (
    <div className="paper-presentation-header">
      <span className={`presentation-badge presentation-${type.toLocaleLowerCase()}`}>
        <span aria-hidden="true">{meta.symbol}</span>
        {meta.label}
      </span>
      {showId && <span className="paper-display-id">{paperId}</span>}
    </div>
  );
}
