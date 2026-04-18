import { StatCard } from "../components/StatCard";
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

function MonthlyInsights() {
  return (
    <section className="panel-card insights-panel">
      <h2 className="panel-title">Monthly Insights</h2>
      <div className="insights-chart-wrap">
        <div className="insights-bubbles" aria-hidden>
          <div className="insights-bubble insights-bubble--nigeria">Nigeria</div>
          <div className="insights-bubble insights-bubble--lagos">Lagos</div>
          <div className="insights-bubble insights-bubble--fans">+174</div>
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

/**
 * Dashboard Page Component.
 */
const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-greet">
          <span className="dashboard-greet-accent">Welcome back, </span>
          <span>Irawo!</span>
        </h1>
        <label className="fan-view-toggle">
          <span>FAN VIEW</span>
          <input type="checkbox" name="fan-view" />
          <span className="fan-view-switch" />
        </label>
      </header>

      <div className="dashboard-body">
        <div className="dashboard-center">
          <MonthlyInsights />

          <section className="panel-card">
            <h2 className="panel-title">Recent Content</h2>
            <article className="recent-row">
              <div className="recent-thumb" />
              <div className="recent-main">
                <span className="recent-title">Day In My Life</span>
                <div className="recent-meta">Video · Apr 2, 2026</div>
              </div>
              <div className="recent-stats">
                <div>
                  Views <strong>12.4K</strong>
                </div>
                <div>
                  Likes <strong>892</strong>
                </div>
                <div>
                  New Fans <strong>54</strong>
                </div>
              </div>
            </article>
            <article className="recent-row">
              <div className="recent-thumb" />
              <div className="recent-main">
                <span className="recent-title">Unreleased Track: Daydreaming</span>
                <div className="recent-meta">Audio File · Mar 28, 2026</div>
              </div>
              <div className="recent-stats">
                <div>
                  Views <strong>8.1K</strong>
                </div>
                <div>
                  Likes <strong>1.2K</strong>
                </div>
                <div>
                  New Fans <strong>31</strong>
                </div>
              </div>
            </article>
            <article className="recent-row">
              <div className="recent-thumb" />
              <div className="recent-main">
                <span className="recent-title">Tour Merch Drop</span>
                <div className="recent-meta">Merch · Mar 15, 2026</div>
              </div>
              <div className="recent-stats">
                <div>
                  Views <strong>5.6K</strong>
                </div>
                <div>
                  Likes <strong>410</strong>
                </div>
                <div>
                  New Fans <strong>18</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="panel-card content-review-panel">
            <h2 className="panel-title">Content In Review</h2>
            <div className="content-review-list">
              <article className="content-review-item">
                <div className="content-review-thumb" aria-hidden />
                <div className="content-review-main">
                  <div className="content-review-title">Behind The Scenes: MV Shoot</div>
                  <div className="content-review-meta">Video</div>
                </div>
                <span className="content-review-pill content-review-pill--review">In Review</span>
              </article>

              <article className="content-review-item">
                <div className="content-review-thumb" aria-hidden />
                <div className="content-review-main">
                  <div className="content-review-title">Early Release: New Single</div>
                  <div className="content-review-meta">Audio File</div>
                </div>
                <span className="content-review-pill content-review-pill--approved">Approved</span>
              </article>
            </div>
          </section>
        </div>

        <aside className="dashboard-rail">
          <div className="stats-stack">
            <StatCard
              label="Total Fans"
              value="4.8K"
              trend="+873 last month"
              tone="blue"
              icon={<IconUsers />}
            />
            <StatCard
              label="Monthly Revenue"
              value="$14,345"
              trend="+1,000 last month"
              tone="purple"
              icon={<IconWallet />}
            />
            <StatCard
              label="Engagement"
              value="84%"
              trend="+6% last month"
              tone="green"
              icon={<IconChart />}
            />
          </div>

          <div className="panel-card notifications-card">
            <h2 className="panel-title">Notifications</h2>
            <div className="notification-item">
              <div className="notification-icon">
                <IconBell />
              </div>
              <div className="notification-body">
                <p>You&apos;ve reached 4,000 fans!</p>
                <span className="notification-time">4 days ago</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
