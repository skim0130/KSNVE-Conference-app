import Image from 'next/image';
import Link from 'next/link';
import { conferenceConfig } from '@/lib/conference-config';

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
      <div><b>{conferenceConfig.shortTitle}</b><small>ANNUAL FALL CONFERENCE</small></div>
    </Link>
    {!compact && <div className="event-meta"><b>{conferenceConfig.shortKoreanTitle}</b><span>{conferenceConfig.displayDate} · {conferenceConfig.venue}</span><small>{conferenceConfig.locationDisplay}</small></div>}
    <nav className="hero-links" aria-label="바로가기">
      <Link href="/notices" aria-label="공지사항">●<span>공지</span></Link>
    </nav>
  </header>;
}
