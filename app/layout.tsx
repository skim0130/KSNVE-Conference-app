import './globals.css';
import type { Viewport } from 'next';
import { conferenceConfig } from '@/lib/conference-config';

export const metadata = {
  title: conferenceConfig.englishTitle,
  description: `${conferenceConfig.koreanTitle} · ${conferenceConfig.locationDisplay}`,
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
  themeColor: '#00796b'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
