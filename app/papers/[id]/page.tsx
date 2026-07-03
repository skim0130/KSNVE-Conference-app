import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import PaperActions from '@/components/PaperActions';
import { dayLabel, papers, sessions, speakers, venues } from '@/lib/conference';

export function generateStaticParams() {
  return papers.map((p) => ({ id: p.id }));
}

export default async function PaperDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const paper = papers.find((p) => p.id === id);
  if (!paper) notFound();

  const session = sessions.find((s) => s.id === paper.sessionId);
  const speaker = speakers.find((s) => s.papers.includes(paper.id));
  const venue = venues.find((v) => v.name === paper.venue);

  return (
    <main className="shell detail-shell paper-detail">
      <Header compact />

      <Link href="/" className="back">
        ‹ 프로그램으로 돌아가기
      </Link>

      <article className="detail-card">
        <span className="paper-type">
          ORAL PRESENTATION · {paper.id.toUpperCase()}
        </span>

        <h1>{paper.title}</h1>

        <div className="presenter">
          <span>{paper.presenter?.slice(0, 1) || '?'}</span>

          <div>
            <small>발표자</small>
            <b>
              {speaker ? (
                <Link className="text-link" href={`/speakers/${speaker.id}`}>
                  {paper.presenter} ›
                </Link>
              ) : (
                paper.presenter
              )}
            </b>
            <p>{paper.authors}</p>
          </div>
        </div>

        <PaperActions id={paper.id} />

        <section className="schedule-panel">
          <div>
            <span>▣</span>
            <p>
              <small>일시</small>
              <b>
                {dayLabel(paper.date)} · {paper.time}
              </b>
            </p>
          </div>

          <div>
            <span>⌖</span>
            <p>
              <small>발표장</small>
              <b>
                {venue ? (
                  <Link className="text-link" href={`/venues/${venue.id}`}>
                    {paper.venue} ›
                  </Link>
                ) : (
                  paper.venue
                )}
              </b>
            </p>
          </div>
        </section>

        <dl className="details">
          <div>
            <dt>세션</dt>
            <dd>
              {session ? (
                <Link className="text-link" href={`/sessions/${session.id}`}>
                  {session.title} ›
                </Link>
              ) : (
                paper.session
              )}
            </dd>
          </div>

          <div>
            <dt>좌장</dt>
            <dd>{session?.chair || '-'}</dd>
          </div>

          {paper.sourcePage && (
            <div>
              <dt>초록집 페이지</dt>
              <dd>{paper.sourcePage}</dd>
            </div>
          )}
        </dl>

        {paper.keywords && paper.keywords.length > 0 && (
          <section className="abstract">
            <h2>키워드</h2>
            <div className="keyword-list">
              {paper.keywords.map((keyword) => (
                <span key={keyword} className="keyword-chip">
                  {keyword}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="abstract">
          <h2>초록</h2>

          {paper.abstract ? (
            <p className="abstract-text">{paper.abstract}</p>
          ) : (
            <p>초록이 등록되지 않았습니다.</p>
          )}
        </section>

        {paper.extractionStatus && paper.extractionStatus !== 'ok' && (
          <section className="abstract">
            <h2>추출 상태</h2>
            <p>{paper.extractionStatus}</p>
          </section>
        )}
      </article>
    </main>
  );
}