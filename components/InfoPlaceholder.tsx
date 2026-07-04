import Link from 'next/link';
import Header from '@/components/Header';

export default function InfoPlaceholder({
  kicker,
  title,
  description,
  note,
}: {
  kicker: string;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <main className="shell detail-shell info-placeholder-page">
      <Header compact />
      <Link href="/?tab=more" className="back">← 더보기</Link>
      <section className="detail-card info-placeholder">
        <span className="kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {note && <div className="placeholder-note">{note}</div>}
      </section>
    </main>
  );
}
