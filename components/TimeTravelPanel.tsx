'use client';

import { useEffect, useState } from 'react';
import type { MockNow } from '@/lib/dashboard-time';

const presets = [
  ['행사 전', '2026-11-24T10:00:00'],
  ['1일차 오전', '2026-11-25T09:00:00'],
  ['1일차 오후', '2026-11-25T14:20:00'],
  ['2일차 오전', '2026-11-26T09:00:00'],
  ['2일차 오후', '2026-11-26T14:20:00'],
  ['3일차 오전', '2026-11-27T09:00:00'],
  ['마지막 날 오전', '2026-11-28T10:00:00'],
  ['행사 종료 후', '2026-11-29T09:00:00'],
] as const;

export default function TimeTravelPanel({ mockNow, onChange }: { mockNow: MockNow | null; onChange: (value: string | null) => void }) {
  const [month, setMonth] = useState('11');
  const [day, setDay] = useState('26');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (!mockNow) return;
    const [, nextMonth, nextDay, nextHour, nextMinute] = mockNow.label.match(/^\d{4}-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/) ?? [];
    if (nextMonth) setMonth(nextMonth);
    if (nextDay) setDay(nextDay);
    if (nextHour) setHour(nextHour);
    if (nextMinute) setMinute(nextMinute);
  }, [mockNow]);

  const normalize = (value: string, minimum: number, maximum: number) => {
    const number = Number(value);
    return Number.isFinite(number) ? String(Math.min(maximum, Math.max(minimum, number))).padStart(2, '0') : '';
  };

  const applyManualTime = () => {
    const nextMonth = normalize(month, 1, 12);
    const nextDay = normalize(day, 1, 31);
    const nextHour = normalize(hour, 0, 23);
    const nextMinute = normalize(minute, 0, 59);
    if (!nextMonth || !nextDay || !nextHour || !nextMinute) return;
    onChange(`2026-${nextMonth}-${nextDay}T${nextHour}:${nextMinute}:00`);
  };

  return (
    <aside className="time-travel-panel" aria-label="개발자 테스트 시간 설정">
      <div className="time-travel-heading">
        <b>🧪 테스트 시간</b>
        {mockNow && <span>Mock time: {mockNow.label}</span>}
      </div>
      <div className="time-preset-list">
        {presets.map(([label, value]) => (
          <button type="button" className={mockNow?.label === value.slice(0, 16).replace('T', ' ') ? 'active' : ''} onClick={() => onChange(value)} key={value}>
            {label}
          </button>
        ))}
      </div>
      <div className="manual-time-controls">
        <span className="manual-year">2026</span>
        <label><span>월</span><input type="number" inputMode="numeric" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        <label><span>일</span><input type="number" inputMode="numeric" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} /></label>
        <label><span>시</span><input type="number" inputMode="numeric" min="0" max="23" value={hour} onChange={(event) => setHour(event.target.value)} /></label>
        <label><span>분</span><input type="number" inputMode="numeric" min="0" max="59" value={minute} onChange={(event) => setMinute(event.target.value)} /></label>
        <button type="button" className="apply-time" onClick={applyManualTime}>적용</button>
        <button type="button" className="restore-time" onClick={() => onChange(null)}>현재시간으로 복원</button>
      </div>
    </aside>
  );
}
