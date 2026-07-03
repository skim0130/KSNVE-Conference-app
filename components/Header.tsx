import Image from 'next/image';
import Link from 'next/link';

export default function Header({ compact = false }: { compact?: boolean }) {
  return <header className={`hero ${compact ? 'hero-compact' : ''}`}>
    <Link href="/" className="brand-mark">
      <Image
        className="brand-logo"
        src="/images/ksnve_logo.png"
        alt="한국소음진동공학회"
        width={1250}
        height={1220}
        sizes="(max-width: 560px) 38px, 42px"
        priority
      />
      <div><b>KSNVE 2026</b><small>SPRING CONFERENCE</small></div>
    </Link>
    {!compact && <div className="event-meta"><b>춘계학술대회</b><span>5월 27–30일 · 쏠비치 삼척</span></div>}
    <nav className="hero-links" aria-label="바로가기">
      <Link href="/notices" aria-label="공지사항">●<span>공지</span></Link>
    </nav>
  </header>;
}
