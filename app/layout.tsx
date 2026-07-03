import './globals.css';
import { conferenceConfig } from '@/lib/conference-config';

export const metadata = {
  title: conferenceConfig.englishTitle,
  description: `${conferenceConfig.koreanTitle} · ${conferenceConfig.locationDisplay}`,
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
