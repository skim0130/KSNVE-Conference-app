type TimedSession = {
  date: string;
  time: string;
};

export type MockNow = {
  date: string;
  instant: Date;
  label: string;
};

export function parseMockNow(value: string | null): MockNow | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return null;
  const instant = new Date(`${value}+09:00`);
  if (Number.isNaN(instant.getTime())) return null;

  return {
    date: value.slice(0, 10),
    instant,
    label: value.slice(0, 16).replace('T', ' '),
  };
}

export function upcomingSessionsAt<T extends TimedSession>(items: T[], now: Date) {
  return items
    .filter((session) => {
      const startsAt = session.time.split(/[~–-]/)[0];
      return new Date(`${session.date}T${startsAt}:00+09:00`).getTime() > now.getTime();
    })
    .sort((left, right) => {
      const leftStart = `${left.date}T${left.time.split(/[~–-]/)[0]}`;
      const rightStart = `${right.date}T${right.time.split(/[~–-]/)[0]}`;
      return leftStart.localeCompare(rightStart);
    });
}
