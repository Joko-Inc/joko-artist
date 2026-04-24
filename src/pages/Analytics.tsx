import { useState } from 'react';
import { StatCard } from '../components/StatCard';
import './Analytics.css';

type AnalyticsTab = 'overview' | 'revenue';

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

function IconWallet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function IconVideoCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="7" width="15" height="10" rx="2" />
      <path d="M17 11l5-3v10l-5-3V11z" />
    </svg>
  );
}

function IconVinyl() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TrendIcon({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up') {
    return (
      <svg className="rev-trend-icon rev-trend-icon--up" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  }
  if (dir === 'down') {
    return (
      <svg className="rev-trend-icon rev-trend-icon--down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg className="rev-trend-icon rev-trend-icon--flat" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12h14" />
    </svg>
  );
}

function FanGrowthPlaceholder() {
  return (
    <div className="analytics-chart-placeholder" aria-hidden>
      <svg viewBox="0 0 400 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fanGrowthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.35)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 Q60,95 100,70 T200,50 T300,35 T400,25 L400,140 L0,140 Z"
          fill="url(#fanGrowthGrad)"
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

/** Revenue vs price — peak near $5–6 */
function RevenueBreakdownChart() {
  const padL = 44;
  const padB = 36;
  const w = 400;
  const h = 220;
  const chartW = w - padL - 16;
  const chartH = h - padB - 24;
  const baseY = 24 + chartH;
  const maxV = 7000;
  const toY = (v: number) => baseY - (v / maxV) * chartH;
  const prices = [2, 3, 4, 5, 6, 7, 8];
  const values = [1200, 1800, 2600, 6400, 5800, 3400, 1900];
  const xs = prices.map((_, i) => padL + (i / (prices.length - 1)) * chartW);
  const pts = values.map((v, i) => [xs[i], toY(v)] as const);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
  const peakIdx = 3;
  const [px, py] = pts[peakIdx];

  return (
    <div className="rev-chart-wrap" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="rev-chart-svg">
        {[0, 3500, 7000].map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 12} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="10" fontWeight="600">
                {tick === 7000 ? '7,000' : tick === 3500 ? '3,500' : '0'}
              </text>
            </g>
          );
        })}
        <path d={d} fill="none" stroke="rgba(192, 167, 255, 0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {prices.map((p, i) => (
          <text key={p} x={xs[i]} y={h - 10} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontWeight="600">
            ${p}.00
          </text>
        ))}
        <rect x={px - 72} y={py - 36} width="144" height="28" rx="6" fill="rgba(40, 32, 65, 0.95)" stroke="rgba(167, 139, 250, 0.35)" />
        <text x={px} y={py - 16} textAnchor="middle" fill="#e9d5ff" fontSize="8" fontWeight="700" letterSpacing="0.06em">
          AVERAGE FAN PRICE
        </text>
        <text x={px} y={py - 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">
          $5.67
        </text>
      </svg>
    </div>
  );
}

function CumulativeRevenueChart() {
  const w = 420;
  const h = 220;
  const padL = 44;
  const padB = 36;
  const chartW = w - padL - 16;
  const chartH = h - padB - 24;
  const baseY = 24 + chartH;
  const maxV = 7000;
  const toY = (v: number) => baseY - (v / maxV) * chartH;
  const months = ['MAR 2026', 'APR 2026', 'MAY 2026', 'JUN 2026', 'JUL 2026'];
  const values = [2100, 3400, 4100, 5200, 6742];
  const xs = months.map((_, i) => padL + (i / (months.length - 1)) * chartW);
  const pts = values.map((v, i) => [xs[i], toY(v)] as const);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
  const last = pts[pts.length - 1];

  return (
    <div className="rev-chart-wrap" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="rev-chart-svg">
        {[0, 3500, 7000].map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 12} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="10" fontWeight="600">
                {tick === 7000 ? '$7,000' : tick === 3500 ? '$3,500' : '$0'}
              </text>
            </g>
          );
        })}
        <path d={d} fill="none" stroke="rgba(192, 167, 255, 0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#1a1028" stroke="rgba(192, 167, 255, 0.95)" strokeWidth="2" />
        ))}
        {months.map((m, i) => (
          <text key={m} x={xs[i]} y={h - 10} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontWeight="600">
            {m}
          </text>
        ))}
        <rect x={last[0] - 88} y={last[1] - 42} width="176" height="34" rx="6" fill="rgba(40, 32, 65, 0.95)" stroke="rgba(167, 139, 250, 0.35)" />
        <text x={last[0]} y={last[1] - 24} textAnchor="middle" fill="#e9d5ff" fontSize="7" fontWeight="700" letterSpacing="0.06em">
          TOTAL REVENUE ALL TIME
        </text>
        <text x={last[0]} y={last[1] - 10} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">
          $6,742
        </text>
      </svg>
    </div>
  );
}

function NewReturningChart() {
  const w = 360;
  const h = 200;
  const maxH = 120;
  const baseY = 160;
  const newH = (4200 / 7000) * maxH;
  const retH = (2800 / 7000) * maxH;
  const cx1 = 110;
  const cx2 = 250;
  const bw = 56;

  return (
    <div className="rev-chart-wrap rev-chart-wrap--bars" aria-hidden>
      <div className="rev-bar-month">
        <button type="button" className="rev-bar-month-nav" aria-label="Previous month">
          ‹
        </button>
        <span>JUNE 2026</span>
        <button type="button" className="rev-bar-month-nav" aria-label="Next month">
          ›
        </button>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="rev-chart-svg">
        <defs>
          <linearGradient id="revBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        {[0, 3500, 7000].map((tick) => {
          const y = baseY - (tick / 7000) * maxH;
          return (
            <g key={tick}>
              <line x1={40} y1={y} x2={w - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="10" fontWeight="600">
                {tick === 7000 ? '7,000' : tick === 3500 ? '3,500' : '0'}
              </text>
            </g>
          );
        })}
        <rect x={cx1 - bw / 2} y={baseY - newH} width={bw} height={newH} rx="8" fill="url(#revBarGrad)" />
        <rect x={cx2 - bw / 2} y={baseY - retH} width={bw} height={retH} rx="8" fill="url(#revBarGrad)" />
        <text x={cx1} y={baseY + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">
          New Subscribers
        </text>
        <text x={cx2} y={baseY + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">
          Returning Subscribers
        </text>
      </svg>
    </div>
  );
}

const RECENT_ROWS = [
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
  { views: '22,743', likes: '7,532', comments: '3,400', fans: '56' },
];

const TOP_CITIES = [
  { rank: 1, trend: 'up' as const, label: 'Lagos, Nigeria', flag: '🇳🇬', amount: '$4,323 / mo' },
  { rank: 2, trend: 'up' as const, label: 'London, UK', flag: '🇬🇧', amount: '$3,891 / mo' },
  { rank: 3, trend: 'down' as const, label: 'New York, USA', flag: '🇺🇸', amount: '$3,102 / mo' },
  { rank: 4, trend: 'flat' as const, label: 'Toronto, Canada', flag: '🇨🇦', amount: '$2,640 / mo' },
  { rank: 5, trend: 'up' as const, label: 'Berlin, Germany', flag: '🇩🇪', amount: '$2,198 / mo' },
  { rank: 6, trend: 'down' as const, label: 'Paris, France', flag: '🇫🇷', amount: '$1,954 / mo' },
  { rank: 7, trend: 'up' as const, label: 'Sydney, Australia', flag: '🇦🇺', amount: '$1,720 / mo' },
];

const TOP_FANS = [
  { rank: 1, name: 'dearshrimp', flag: '🇺🇸', amount: '$88.88 / mo' },
  { rank: 2, name: 'waveform_k', flag: '🇬🇧', amount: '$72.40 / mo' },
  { rank: 3, name: 'nolimitsaudio', flag: '🇳🇬', amount: '$64.00 / mo' },
  { rank: 4, name: 'midnightvibes', flag: '🇨🇦', amount: '$59.20 / mo' },
  { rank: 5, name: 'fanclub_jade', flag: '🇯🇵', amount: '$54.10 / mo' },
  { rank: 6, name: 'supportlocal', flag: '🇺🇸', amount: '$48.00 / mo' },
  { rank: 7, name: 'playlist_addict', flag: '🇧🇷', amount: '$42.50 / mo' },
];

function OverviewTab() {
  return (
    <>
      <div className="analytics-stats-row">
        <StatCard label="Total Fans" value="12.4K" trend="+1.2k this month" tone="blue" icon={<IconUsers />} />
        <StatCard label="Avg. Sub Amount" value="$8" trend="+$1 this month" tone="teal" icon={<IconDollar />} />
        <StatCard label="Engagement Rate" value="72%" trend="-2% this month" tone="green" icon={<IconChart />} trendVariant="negative" />
        <StatCard label="Total Views" value="42k" trend="+1.2k this month" tone="yellow" icon={<IconEye />} />
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
    </>
  );
}

function RevenueTab() {
  return (
    <>
      <div className="analytics-stats-row">
        <StatCard label="Revenue" value="$12,000" trend="+1.2k this month" tone="purple" icon={<IconWallet />} />
        <StatCard label="Average Seat Price" value="$5.67" trend="+$0.20 this month" tone="blue" icon={<IconUsers />} />
        <StatCard label="Subscription Revenue" value="$8,000" trend="+1.2k this month" tone="red" icon={<IconVideoCamera />} />
        <StatCard label="Merch Sales" value="$4,000" trend="+1.2k this month" tone="green" icon={<IconVinyl />} />
      </div>

      <div className="rev-mid-grid">
        <div className="analytics-chart-card rev-card-tall">
          <h3>Revenue Breakdown</h3>
          <RevenueBreakdownChart />
        </div>
        <div className="analytics-chart-card rev-card-list">
          <h3>Top Cities</h3>
          <ul className="rev-rank-list">
            {TOP_CITIES.map((row) => (
              <li key={row.rank} className="rev-rank-row">
                <span className="rev-rank-trend">
                  <TrendIcon dir={row.trend} />
                </span>
                <span className="rev-rank-num">{row.rank}.</span>
                <span className="rev-rank-label">
                  {row.label} {row.flag}
                </span>
                <span className="rev-rank-amount">{row.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="analytics-chart-card rev-card-list">
          <h3>Top Fans</h3>
          <ul className="rev-rank-list">
            {TOP_FANS.map((row) => (
              <li key={row.rank} className="rev-rank-row rev-rank-row--fan">
                <span className="rev-rank-num">{row.rank}.</span>
                <span className="rev-rank-label">
                  {row.name} {row.flag}
                </span>
                <span className="rev-rank-amount">{row.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="analytics-bottom-grid rev-bottom-pair">
        <div className="analytics-chart-card rev-card-tall">
          <h3>Cumulative Revenue</h3>
          <CumulativeRevenueChart />
        </div>
        <div className="analytics-chart-card rev-card-tall">
          <h3>New v. Returning Revenue</h3>
          <NewReturningChart />
        </div>
      </div>
    </>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <div className="analytics-header-actions">
          <div className="analytics-segment" role="tablist" aria-label="Analytics sections">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'overview'}
              className={tab === 'overview' ? 'analytics-segment--active' : ''}
              onClick={() => setTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'revenue'}
              className={tab === 'revenue' ? 'analytics-segment--active' : ''}
              onClick={() => setTab('revenue')}
            >
              Revenue
            </button>
          </div>
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
        </div>
      </header>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'revenue' && <RevenueTab />}
    </div>
  );
}
