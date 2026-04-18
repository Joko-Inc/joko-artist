import { useMemo, useState } from 'react';
import './Create.css';

type CreateTab = 'scheduled' | 'create' | 'review';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

type CalendarEvent = {
  day: number;
  title: string;
  time: string;
  variant: 'orange' | 'purple' | 'mustard';
};

/** Demo schedule — keyed by month index 0–11 and day */
const SCHEDULED_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-1': [
    { day: 6, title: 'Track Demo', time: '12:00pm', variant: 'orange' },
    { day: 11, title: 'Studio Session Stream', time: '3:00pm', variant: 'purple' },
    { day: 23, title: 'Album Announcement', time: '1:00pm', variant: 'mustard' },
  ],
};

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

function IconUpload() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconShirt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1 1.73v3.82a2 2 0 0 0 1 1.73L8 12v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8l4.38-2.26a2 2 0 0 0 1-1.73V5.19a2 2 0 0 0-1-1.73z" />
    </svg>
  );
}

function IconVideoSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ScheduledView({ year, month, onPrev, onNext }: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const key = `${year}-${month}`;
  const events = SCHEDULED_EVENTS[key] ?? [];

  const eventsByDay = useMemo(() => {
    const m = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      const list = m.get(e.day) ?? [];
      list.push(e);
      m.set(e.day, list);
    }
    return m;
  }, [events]);

  return (
    <div className="calendar-shell">
      <div className="calendar-nav">
        <button type="button" onClick={onPrev} aria-label="Previous month">
          ‹
        </button>
        <div className="calendar-month-label">{MONTH_NAMES[month]}</div>
        <button type="button" onClick={onNext} aria-label="Next month">
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
                  key={ev.title + ev.time}
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
  );
}

type ContentKind = 'social' | 'video' | 'audio' | 'merch';

function CreateFormView() {
  const [kind, setKind] = useState<ContentKind>('video');

  return (
    <div className="create-split">
      <div className="create-form-card">
        <h2>Create New</h2>
        <div className="type-grid" role="group" aria-label="Content type">
          {([
            { id: 'social' as const, label: 'Social Post', Icon: IconDoc },
            { id: 'video' as const, label: 'Video', Icon: IconPlay },
            { id: 'audio' as const, label: 'Audio File', Icon: IconMusic },
            { id: 'merch' as const, label: 'Merchandise', Icon: IconShirt },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`type-card type-card--${id} ${kind === id ? 'type-card--active' : ''}`}
              onClick={() => setKind(id)}
            >
              <div className="type-card-icon">
                <Icon />
              </div>
              <div className="type-card-label">{label}</div>
            </button>
          ))}
        </div>

        <div className="form-field">
          <label htmlFor="create-title">Title</label>
          <input id="create-title" name="title" placeholder="Enter title.." autoComplete="off" />
        </div>
        <div className="form-field">
          <label htmlFor="create-desc">Description</label>
          <textarea id="create-desc" name="description" placeholder="Enter a description..." />
        </div>
        <div className="form-field">
          <label>Upload Media</label>
          <div className="upload-zone" role="button" tabIndex={0}>
            <div>
              <IconUpload />
              <div>
                Drag &amp; drop files here or click to browse.
                <br />
                Support for images, audio, video, and documents.
              </div>
            </div>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="create-cat">Category</label>
          <select id="create-cat" name="category" defaultValue="">
            <option value="" disabled>
              Select category
            </option>
            <option value="music">Music</option>
            <option value="behind">Behind the scenes</option>
            <option value="live">Live</option>
            <option value="merch">Merch</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="create-date">Date</label>
          <input id="create-date" name="date" type="date" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-submit">
            Submit
          </button>
          <button type="button" className="btn-draft">
            Save Draft
          </button>
        </div>
      </div>

      <aside className="drafts-column">
        <h3>Drafts</h3>
        <article className="draft-card">
          <span className="draft-badge">Draft</span>
          <div className="draft-card-head">
            <div className="inreview-icon" style={{ width: 36, height: 36 }}>
              <IconVideoSmall />
            </div>
            <div>
              <p className="draft-card-title">NYFW Vlog</p>
              <p className="draft-card-meta">Last edited 7 hrs ago</p>
            </div>
          </div>
          <div className="draft-progress-wrap">
            <div className="draft-progress-label">
              <span>Progress</span>
              <span>64%</span>
            </div>
            <div className="draft-progress-bar">
              <div className="draft-progress-fill" style={{ width: '64%' }} />
            </div>
          </div>
          <button type="button" className="btn-continue">
            Continue Editing
          </button>
        </article>
        <article className="draft-card">
          <span className="draft-badge">Draft</span>
          <div className="draft-card-head">
            <div className="inreview-icon" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#8a5520,#623814)' }}>
              <IconMusic />
            </div>
            <div>
              <p className="draft-card-title">Summer Single Teaser</p>
              <p className="draft-card-meta">Last edited 2 days ago</p>
            </div>
          </div>
          <div className="draft-progress-wrap">
            <div className="draft-progress-label">
              <span>Progress</span>
              <span>28%</span>
            </div>
            <div className="draft-progress-bar">
              <div className="draft-progress-fill" style={{ width: '28%' }} />
            </div>
          </div>
          <button type="button" className="btn-continue">
            Continue Editing
          </button>
        </article>
      </aside>
    </div>
  );
}

function InReviewView() {
  const [toastOpen, setToastOpen] = useState(true);

  return (
    <div className="inreview-wrap">
      {toastOpen && (
        <div className="inreview-toast" role="status">
          <div>
            <p>
              SUCCESSFULLY SUBMITTED!
              <small>Your work will be reviewed soon.</small>
            </p>
          </div>
          <button
            type="button"
            className="inreview-toast-close"
            onClick={() => setToastOpen(false)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="inreview-list" style={{ marginTop: toastOpen ? 56 : 8 }}>
        <article className="inreview-card">
          <div className="inreview-card-top">
            <div className="inreview-icon">
              <IconVideoSmall />
            </div>
            <div className="inreview-card-text">
              <h3>Behind the Scenes: NYFW Vlog</h3>
              <p>Video</p>
            </div>
            <span className="status-badge-review">In Review</span>
          </div>
          <div className="reviewer-bar">
            <div className="reviewer-avatar" aria-hidden />
            <div>
              <p>Adeoluwa Adeyemo</p>
              <span>Reviewer | Submitted 2 hrs ago</span>
            </div>
          </div>
          <div className="inreview-timeline-section">
            <p className="inreview-timeline-title">Review Timeline</p>
            <div className="timeline">
              <div className="timeline-step">
                <div className="timeline-dot">✓</div>
                <div className="timeline-step-body">
                  <strong>Submitted</strong>
                  <span>Feb 23, 2026 10:00am</span>
                </div>
              </div>
              <div className="timeline-step">
                <div className="timeline-dot timeline-dot--pending" />
                <div className="timeline-step-body">
                  <strong>Review</strong>
                  <span className="pending-label">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="inreview-card">
          <div className="inreview-card-top">
            <div className="inreview-icon" style={{ background: 'linear-gradient(135deg,#8a5520,#623814)' }}>
              <IconMusic />
            </div>
            <div className="inreview-card-text">
              <h3>Unreleased Track: Daydreaming</h3>
              <p>Audio File</p>
            </div>
            <span className="status-badge-review">In Review</span>
          </div>
          <div className="reviewer-bar">
            <div className="reviewer-avatar" aria-hidden />
            <div>
              <p>Sarah Chen</p>
              <span>Reviewer | Submitted 1 day ago</span>
            </div>
          </div>
          <div className="inreview-timeline-section">
            <p className="inreview-timeline-title">Review Timeline</p>
            <div className="timeline">
              <div className="timeline-step">
                <div className="timeline-dot">✓</div>
                <div className="timeline-step-body">
                  <strong>Submitted</strong>
                  <span>Feb 20, 2026 4:30pm</span>
                </div>
              </div>
              <div className="timeline-step">
                <div className="timeline-dot timeline-dot--pending" />
                <div className="timeline-step-body">
                  <strong>Review</strong>
                  <span className="pending-label">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function Create() {
  const [tab, setTab] = useState<CreateTab>('scheduled');
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const goPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const headerTitle =
    tab === 'scheduled' ? 'My Schedule' : 'Create';

  return (
    <div className="create-page">
      <header className="create-header">
        <h1 className="create-title">{headerTitle}</h1>
        <div className="create-segment" role="tablist" aria-label="Create workspace">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'scheduled'}
            className={tab === 'scheduled' ? 'create-segment--active' : ''}
            onClick={() => setTab('scheduled')}
          >
            Scheduled
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'create'}
            className={tab === 'create' ? 'create-segment--active' : ''}
            onClick={() => setTab('create')}
          >
            Create
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'review'}
            className={tab === 'review' ? 'create-segment--active' : ''}
            onClick={() => setTab('review')}
          >
            In Review
          </button>
        </div>
      </header>

      {tab === 'scheduled' && (
        <ScheduledView year={viewYear} month={viewMonth} onPrev={goPrevMonth} onNext={goNextMonth} />
      )}
      {tab === 'create' && <CreateFormView />}
      {tab === 'review' && <InReviewView />}
    </div>
  );
}
