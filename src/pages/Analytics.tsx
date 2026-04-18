import { StatCard } from '../components/StatCard';
import './Analytics.css';

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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

function IconEye() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FanGrowthPlaceholder() {
  return (
    <div className="analytics-chart-placeholder" aria-hidden>
      <svg viewBox="0 0 400 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.35)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 Q60,95 100,70 T200,50 T300,35 T400,25 L400,140 L0,140 Z"
          fill="url(#ag)"
        />
        <path
          d="M0,100 Q60,95 100,70 T200,50 T300,35 T400,25"
          fill="none"
          stroke="rgba(167, 139, 250, 0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function EngagementPlaceholder() {
  return (
    <div className="analytics-chart-placeholder" aria-hidden>
      <svg viewBox="0 0 400 140" preserveAspectRatio="none">
        <path
          d="M0,90 L50,85 L100,95 L150,60 L200,70 L250,45 L300,55 L350,30 L400,40"
          fill="none"
          stroke="rgba(45, 212, 191, 0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0,110 L50,100 L100,105 L150,88 L200,92 L250,80 L300,85 L350,72 L400,78"
          fill="none"
          stroke="rgba(167, 139, 250, 0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
      </svg>
    </div>
  );
}

const RECENT_ROWS = [
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
];

export default function Analytics() {
  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <div className="analytics-toolbar">
          <button type="button" className="analytics-toolbar-btn">
            <IconDownload />
            Export
          </button>
          <select className="analytics-toolbar-select" defaultValue="30" aria-label="Date range">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </header>

      <div className="analytics-stats-row">
        <StatCard
          label="Total Fans"
          value="12.4K"
          trend="+1.2k this month"
          tone="blue"
          icon={<IconUsers />}
        />
        <StatCard
          label="Avg. Sub Amount"
          value="$8"
          trend="+$1 this month"
          tone="teal"
          icon={<IconDollar />}
        />
        <StatCard
          label="Engagement Rate"
          value="72%"
          trend="-2% this month"
          tone="green"
          icon={<IconChart />}
          trendVariant="negative"
        />
        <StatCard
          label="Total Views"
          value="42k"
          trend="+1.2k this month"
          tone="yellow"
          icon={<IconEye />}
        />
      </div>

      <section className="analytics-panel">
        <h2 className="analytics-panel-title">Recent Content</h2>
        {RECENT_ROWS.map((row, i) => (
          <div key={i} className="analytics-content-row">
            <span className="analytics-content-title">Day In My Life</span>
            <div className="analytics-content-metrics">
              <div className="analytics-metric">
                Views
                <strong>{row.views}</strong>
              </div>
              <div className="analytics-metric">
                Likes
                <strong>{row.likes}</strong>
              </div>
              <div className="analytics-metric">
                Comments
                <strong>{row.comments}</strong>
              </div>
              <div className="analytics-metric">
                New Fans
                <strong>{row.fans}</strong>
              </div>
            </div>
          </div>
        ))}
        <div className="analytics-see-more-wrap">
          <button type="button" className="analytics-see-more">
            See More
          </button>
        </div>
      </section>

      <div className="analytics-bottom-grid">
        <div className="analytics-chart-card">
          <h3>Fan Growth</h3>
          <FanGrowthPlaceholder />
        </div>
        <div className="analytics-chart-card">
          <h3>Engagement Overview</h3>
          <EngagementPlaceholder />
        </div>
      </div>
    </div>
  );
}
