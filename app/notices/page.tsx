'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { announcements } from '@/lib/conference';

const storageKey = 'ksnveReadAnnouncements';

export default function Notices() {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(value)) setRead(value.filter((item): item is string => typeof item === 'string'));
    } catch {
      setRead([]);
    }
  }, []);

  const markRead = (id: string) => setRead((current) => {
    if (current.includes(id)) return current;
    const next = [...current, id];
    localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  });
  const unread = announcements.filter((item) => !read.includes(item.id)).length;

  return <main className="shell detail-shell"><Header compact/><Link href="/?tab=more" className="back">← 더보기</Link><div className="section-heading"><div><span className="kicker">ANNOUNCEMENTS</span><h1>공지사항</h1></div><strong>{unread} 새 소식</strong></div><div className="list">{announcements.map((item) => <button className={`card notice announcement-card ${read.includes(item.id) ? 'read' : ''}`} key={item.id} onClick={() => markRead(item.id)}><div><span className="badge">{item.category}</span>{!read.includes(item.id) && <em>NEW</em>}</div><h2>{item.title}</h2><p>{item.body}</p><time>{item.date.replaceAll('-', '.')}</time></button>)}</div></main>;
}
