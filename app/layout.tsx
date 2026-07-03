import './globals.css';

export const metadata = {
  title: 'KSNVE 2026 Spring Conference App',
  description: 'PWA prototype for the KSNVE 2026 Spring Conference',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
