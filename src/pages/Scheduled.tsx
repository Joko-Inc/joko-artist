import { useCallback, useEffect, useMemo, useState } from 'react';
import './Scheduled.css';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

type ReviewStatus = 'pending' | 'accepted' | 'declined';

type Post = {
  id: string;
  name: string;
  posted_date: string | null;
  review_status: ReviewStatus | null;
  file_type: string;
};

type ScheduledEvent = {
  id: string;
  year: number;
  month: number;
  day: number;
  title: string;
  time: string;
  variant: 'orange' | 'purple' | 'mustard';
};

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'In review',
  accepted: 'Accepted',
  declined: 'Declined',
};

function variantForReview(status: ReviewStatus | null): ScheduledEvent['variant'] {
  if (status === 'pending') return 'purple';
  if (status === 'accepted') return 'mustard';
  return 'orange';
}

function parsePostedDate(dateStr: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return { year, month, day };
}

function postToEvent(post: Post): ScheduledEvent | null {
  if (!post.posted_date) return null;
  const parts = parsePostedDate(post.posted_date);
  if (!parts) return null;
  const rs = (post.review_status ?? 'pending') as ReviewStatus;
  return {
    id: post.id,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    title: post.name,
    time: REVIEW_STATUS_LABEL[rs] ?? 'In review',
    variant: variantForReview(post.review_status),
  };
}

function buildCalendarGrid(year: number, month: number): ({ day: number } | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  const total = Math.ceil(cells.length / 7) * 7;
  while (cells.length < total) cells.push(null);
  return cells;
}

function eventToDate(ev: ScheduledEvent): Date {
  return new Date(ev.year, ev.month, ev.day);
}

function formatEventDate(ev: ScheduledEvent): string {
  return eventToDate(ev).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function EventList({
  title,
  events,
  emptyLabel,
}: {
  title: string;
  events: ScheduledEvent[];
  emptyLabel: string;
}) {
  return (
    <section className="schedule-events-panel">
      <h2 className="schedule-events-heading">{title}</h2>
      {events.length === 0 ? (
        <p className="schedule-events-empty">{emptyLabel}</p>
      ) : (
        <ul className="schedule-events-list">
          {events.map((ev) => (
            <li key={ev.id} className="schedule-events-item">
              <span className={`schedule-events-dot schedule-events-dot--${ev.variant}`} aria-hidden />
              <div className="schedule-events-body">
                <span className="schedule-events-title">{ev.title}</span>
                <span className="schedule-events-meta">
                  {formatEventDate(ev)} · {ev.time}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Scheduled() {
  const now = new Date();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?status=submitted');
      if (res.ok) setPosts(await res.json());
    } catch {
      /* server not running */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const allEvents = useMemo(
    () => posts.map(postToEvent).filter((e): e is ScheduledEvent => e !== null),
    [posts],
  );

  const availableYears = useMemo(() => {
    const years = new Set(allEvents.map((e) => e.year));
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => a - b);
  }, [allEvents]);

  const cells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const eventsByDay = useMemo(() => {
    const m = new Map<number, ScheduledEvent[]>();
    for (const e of allEvents) {
      if (e.year !== viewYear || e.month !== viewMonth) continue;
      const list = m.get(e.day) ?? [];
      list.push(e);
      m.set(e.day, list);
    }
    return m;
  }, [allEvents, viewYear, viewMonth]);

  const { upcoming, previous } = useMemo(() => {
    const today = startOfToday();
    const yearEvents = allEvents.filter((e) => e.year === viewYear);
    const up: ScheduledEvent[] = [];
    const prev: ScheduledEvent[] = [];
    for (const e of yearEvents) {
      const d = eventToDate(e);
      if (d >= today) up.push(e);
      else prev.push(e);
    }
    up.sort((a, b) => eventToDate(a).getTime() - eventToDate(b).getTime());
    prev.sort((a, b) => eventToDate(b).getTime() - eventToDate(a).getTime());
    return { upcoming: up, previous: prev };
  }, [allEvents, viewYear]);

  const handleYearChange = (year: number) => {
    setViewYear(year);
    if (year === now.getFullYear()) {
      setViewMonth(now.getMonth());
    } else {
      setViewMonth(0);
    }
  };

  const goPrevMonth = () => setViewMonth((m) => Math.max(0, m - 1));
  const goNextMonth = () => setViewMonth((m) => Math.min(11, m + 1));
  const canGoPrev = viewMonth > 0;
  const canGoNext = viewMonth < 11;

  return (
    <div className="scheduled-page">
      <header className="scheduled-header">
        <h1 className="scheduled-title">My Schedule</h1>
        <label className="scheduled-year-filter">
          <span className="scheduled-year-filter-label">Year</span>
          <select
            className="scheduled-year-select"
            value={viewYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            aria-label="Filter by year"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </header>

      {loading ? (
        <p className="scheduled-loading">Loading schedule…</p>
      ) : (
        <>
          <div className="calendar-shell">
            <div className="calendar-nav">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={!canGoPrev}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="calendar-month-label">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                disabled={!canGoNext}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="calendar-weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {cells.map((cell, i) => {
                if (!cell) {
                  return <div key={`e-${i}`} className="calendar-cell calendar-cell--empty" />;
                }
                const dayEvents = eventsByDay.get(cell.day) ?? [];
                return (
                  <div key={cell.day} className="calendar-cell">
                    <span className="calendar-day-num">{String(cell.day).padStart(2, '0')}</span>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`calendar-event calendar-event--${ev.variant}`}
                      >
                        <span>{ev.title}</span>
                        <span>{ev.time}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="schedule-events-grid">
            <EventList
              title="Upcoming Events"
              events={upcoming}
              emptyLabel="No upcoming posts scheduled for this year. Submit content from Create with a scheduled date."
            />
            <EventList
              title="Previous Events"
              events={previous}
              emptyLabel="No past scheduled posts for this year."
            />
          </div>
        </>
      )}
    </div>
  );
}
