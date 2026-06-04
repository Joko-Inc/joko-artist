import { useEffect, useState } from "react";
import { StatCard } from "../components/StatCard";
import { authHeaders, getUser } from "../auth";
import "./Dashboard.css";

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

type Post = {
  id: string;
  name: string;
  file_type: 'video' | 'audio' | 'social' | 'merch';
  thumbnail_url: string | null;
  category: string | null;
  posted_date: string | null;
  status: 'draft' | 'submitted';
  review_status: 'pending' | 'accepted' | 'declined' | null;
  created_at: string;
};

type ArtistInsights = {
  totalFans: number;
  newFansThisWeek: number;
  newFansThisMonth: number;
  newFansPrevMonth: number;
  topRegion: string | null;
  topCity: string | null;
  monthlyRevenue: number;
  engagement: number;
};

const KIND_LABEL: Record<Post['file_type'], string> = {
  video: 'Video',
  audio: 'Audio File',
  social: 'Social Post',
  merch: 'Merchandise',
};

const REVIEW_PILL: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'content-review-pill--review' },
  accepted: { label: 'Accepted', cls: 'content-review-pill--approved' },
  declined: { label: 'Declined', cls: 'content-review-pill--declined' },
};

function formatDate(iso: string) {
  return new Date(iso + 'Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTrend(current: number, previous: number, suffix: string): string {
  const delta = current - previous;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${formatCompact(Math.abs(delta))} ${suffix}`;
}

function MonthlyInsights({ insights, loading }: { insights: ArtistInsights | null; loading: boolean }) {
  if (loading) {
    return (
      <section className="panel-card insights-panel">
        <h2 className="panel-title">Monthly Insights</h2>
        <p className="insights-empty">Loading fan insights…</p>
      </section>
    );
  }

  const weekFans = insights?.newFansThisWeek ?? 0;
  const topCity = insights?.topCity ?? '—';
  const topRegion = insights?.topRegion ?? '—';

  return (
    <section className="panel-card insights-panel">
      <h2 className="panel-title">Monthly Insights</h2>
      <div className="insights-chart-wrap">
        <div className="insights-bubbles" aria-hidden>
          <div className="insights-bubble insights-bubble--fans">
            {weekFans > 0 ? `+${weekFans}` : '—'}
          </div>
          <div className="insights-bubble insights-bubble--lagos">{topCity}</div>
          <div className="insights-bubble insights-bubble--nigeria">{topRegion}</div>
        </div>
        <div className="insights-legend">
          <span className="insights-legend-item">
            <span className="insights-legend-dot insights-legend-dot--purple" />
            Most Active Region
          </span>
          <span className="insights-legend-item">
            <span className="insights-legend-dot insights-legend-dot--blue" />
            Top City
          </span>
          <span className="insights-legend-item">
            <span className="insights-legend-dot insights-legend-dot--deep" />
            New Fans This Week
          </span>
        </div>
      </div>
      {(insights?.totalFans ?? 0) === 0 && (
        <p className="insights-empty">Fan insights appear when fans subscribe through the Joko fan app.</p>
      )}
    </section>
  );
}

const Dashboard = () => {
  const user = getUser();
  const firstName = user?.name.split(' ')[0] ?? 'Artist';
  const [posts, setPosts] = useState<Post[]>([]);
  const [insights, setInsights] = useState<ArtistInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts?status=submitted', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPosts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/artist/insights', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, []);

  const recentPosts = posts.slice(0, 3);
  const inReviewPosts = posts.filter((p) => p.review_status === 'pending');

  const totalFans = insights?.totalFans ?? 0;
  const fanTrend = insights
    ? formatTrend(insights.newFansThisMonth, insights.newFansPrevMonth, 'last month')
    : '—';
  const revenue = insights?.monthlyRevenue ?? 0;
  const engagement = insights?.engagement ?? 0;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-greet">
          <span className="dashboard-greet-accent">Welcome back, </span>
          <span>{firstName}!</span>
        </h1>
        <label className="fan-view-toggle">
          <input type="checkbox" name="fan-view" />
          <span className="fan-view-switch" />
          <span>FAN VIEW</span>
        </label>
      </header>

      <div className="dashboard-body">
        <div className="dashboard-center">
          <MonthlyInsights insights={insights} loading={insightsLoading} />

          <section className="panel-card">
            <h2 className="panel-title">Recent Content</h2>
            {recentPosts.length === 0 && (
              <p style={{ opacity: 0.4, fontSize: 14, margin: 0 }}>No posts yet.</p>
            )}
            {recentPosts.map((post) => (
              <article key={post.id} className="recent-row">
                <div
                  className="recent-thumb"
                  style={post.thumbnail_url ? { backgroundImage: `url(${post.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                />
                <div className="recent-main">
                  <span className="recent-title">{post.name}</span>
                  <div className="recent-meta">{KIND_LABEL[post.file_type]} · {formatDate(post.created_at)}</div>
                </div>
                <div className="recent-stats">
                  <div><strong>—</strong> Views</div>
                  <div><strong>—</strong> New Fans</div>
                </div>
              </article>
            ))}
          </section>

          <section className="panel-card content-review-panel">
            <h2 className="panel-title">Content In Review</h2>
            <div className="content-review-list">
              {inReviewPosts.length === 0 && (
                <p style={{ opacity: 0.4, fontSize: 14, margin: 0 }}>Nothing pending review.</p>
              )}
              {inReviewPosts.map((post) => {
                const pill = REVIEW_PILL[post.review_status ?? 'pending'];
                return (
                  <article key={post.id} className="content-review-item">
                    <div
                      className="content-review-thumb"
                      aria-hidden
                      style={post.thumbnail_url ? { backgroundImage: `url(${post.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    />
                    <div className="content-review-main">
                      <div className="content-review-title">{post.name}</div>
                      <div className="content-review-meta">{KIND_LABEL[post.file_type]}</div>
                    </div>
                    <span className={`content-review-pill ${pill.cls}`}>{pill.label}</span>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="dashboard-rail">
          <div className="stats-stack">
            <StatCard
              label="Total Fans"
              value={formatCompact(totalFans)}
              trend={fanTrend}
              tone="blue"
              icon={<IconUsers />}
            />
            <StatCard
              label="Monthly Revenue"
              value={formatCurrency(revenue)}
              trend={insights ? `${formatCompact(insights.newFansThisMonth)} new fans` : '—'}
              tone="purple"
              icon={<IconWallet />}
            />
            <StatCard
              label="Engagement"
              value={`${Math.round(engagement)}%`}
              trend={insights && insights.newFansThisWeek > 0
                ? `+${insights.newFansThisWeek} fans this week`
                : '—'}
              tone="green"
              icon={<IconChart />}
            />
          </div>

          <div className="panel-card notifications-card">
            <h2 className="panel-title">Notifications</h2>
            {totalFans >= 1000 ? (
              <div className="notification-item">
                <div className="notification-icon"><IconBell /></div>
                <div className="notification-body">
                  <p>You&apos;ve reached {formatCompact(totalFans)} fans!</p>
                  <span className="notification-time">Recently</span>
                </div>
              </div>
            ) : (
              <p style={{ opacity: 0.4, fontSize: 14, margin: 0 }}>No notifications yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
