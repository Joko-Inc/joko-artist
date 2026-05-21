import { useEffect, useState } from "react";
import { StatCard } from "../components/StatCard";
import { getUser } from "../auth";
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

function MonthlyInsights() {
  return (
    <section className="panel-card insights-panel">
      <h2 className="panel-title">Monthly Insights</h2>
      <div className="insights-chart-wrap">
        <div className="insights-bubbles" aria-hidden>
          <div className="insights-bubble insights-bubble--fans">+174</div>
          <div className="insights-bubble insights-bubble--lagos">Lagos</div>
          <div className="insights-bubble insights-bubble--nigeria">Nigeria</div>
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
    </section>
  );
}

const Dashboard = () => {
  const user = getUser();
  const firstName = user?.name.split(' ')[0] ?? 'Artist';
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/posts?status=submitted')
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  const recentPosts = posts.slice(0, 3);
  const inReviewPosts = posts.filter((p) => p.review_status === 'pending');

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
          <MonthlyInsights />

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
        </div>

        <aside className="dashboard-rail">
          <div className="stats-stack">
            <StatCard label="Total Fans" value="4.8K" trend="+873 last month" tone="blue" icon={<IconUsers />} />
            <StatCard label="Monthly Revenue" value="$14,345" trend="+1,000 last month" tone="purple" icon={<IconWallet />} />
            <StatCard label="Engagement" value="84%" trend="+6% last month" tone="green" icon={<IconChart />} />
          </div>

          <div className="panel-card notifications-card">
            <h2 className="panel-title">Notifications</h2>
            <div className="notification-item">
              <div className="notification-icon"><IconBell /></div>
              <div className="notification-body">
                <p>You&apos;ve reached 4,000 fans!</p>
                <span className="notification-time">4 days ago</span>
              </div>
            </div>
          </div>
        </aside>

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
    </div>
  );
};

export default Dashboard;
