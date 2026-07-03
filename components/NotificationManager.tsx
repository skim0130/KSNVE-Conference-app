'use client';

import { useEffect, useState } from 'react';
import { papers } from '@/lib/conference';

const notifiedKey = 'ksnveNotifiedPapers';

function paperStart(date: string, time: string) {
  const start = time.split('~')[0];
  const [hour, minute] = start.split(':').map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value;
}

export default function NotificationManager({ favoriteIds }: { favoriteIds: string[] }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    const check = () => {
      const now = Date.now();
      let notified: string[] = [];
      try {
        const value: unknown = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
        if (Array.isArray(value)) notified = value.filter((item): item is string => typeof item === 'string');
      } catch {
        notified = [];
      }
      const next = new Set(notified);
      papers.filter((paper) => favoriteIds.includes(paper.id)).forEach((paper) => {
        const start = paperStart(paper.date, paper.time).getTime();
        const notifyAt = start - 10 * 60 * 1000;
        if (now >= notifyAt && now < start && !next.has(paper.id)) {
          new Notification('발표가 10분 후 시작됩니다', {
            body: `${paper.title} · ${paper.venue}`,
            tag: `paper-${paper.id}`,
          });
          next.add(paper.id);
        }
      });
      localStorage.setItem(notifiedKey, JSON.stringify([...next]));
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [favoriteIds, permission]);

  if (permission === 'unsupported') return null;
  if (permission === 'granted') return <div className="notification-status"><span>✓</span><div><b>일정 알림 켜짐</b><small>즐겨찾기 발표 10분 전에 알려드려요.</small></div></div>;
  if (permission === 'denied') return <div className="notification-status denied"><span>!</span><div><b>알림이 차단되어 있습니다</b><small>브라우저 사이트 설정에서 알림을 허용해 주세요.</small></div></div>;

  const request = async () => setPermission(await Notification.requestPermission());
  return <button className="notification-prompt" onClick={request}><span>♢</span><div><b>발표 알림 받기</b><small>즐겨찾기 발표 10분 전에 알려드려요.</small></div><em>켜기</em></button>;
}
