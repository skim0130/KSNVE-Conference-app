import Image from 'next/image';
import Link from 'next/link';
import { conferenceConfig } from '@/lib/conference-config';

export default function Header({ compact = false }: { compact?: boolean }) {
  return <header className={`hero ${compact ? 'hero-compact' : 'hero-today'}`}>
    <Link href="/" className="brand-mark">
      <Image
        className="brand-logo"
        src="/images/ksnve-logo-transparent.png"
        alt="한국소음진동공학회"
        width={594}
        height={587}
        sizes="(max-width: 560px) 88px, 100px"
        priority
      />
      <div className="hero-title-block">
        <b><span>2026 추계</span><span>소음진동 학술대회</span></b>
        <small><span>{conferenceConfig.displayDate}</span><span>{conferenceConfig.venue}</span></small>
      </div>
    </Link>
    <nav className="hero-links" aria-label="바로가기">
      <Link href="/notices" aria-label="공지사항">●<span>공지</span></Link>
    </nav>
  </header>;
}
