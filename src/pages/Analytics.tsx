import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { getToken } from '../auth';
import './Analytics.css';

interface RevenueData {
  totalRevenue: number;
  avgSubAmount: number;
  newRevenue: number;
  returningRevenue: number;
  topCities: { label: string; country: string | null; fan_count: number; revenue: number }[];
  topFans: { display_name: string | null; country: string | null; monthly_amount: number }[];
  revenueByPrice: { price: number; revenue: number }[];
}

interface InsightsData {
  totalFans: number;
  newFansThisMonth: number;
  newFansPrevMonth: number;
  monthlyRevenue: number;
  engagement: number;
  totalViews: number;
  avgSubAmount: number;
  topRegion: string | null;
  topCity: string | null;
  fanGrowthByMonth: { month: string; count: number }[];
}

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


function FanGrowthChart({ months }: { months: { month: string; count: number }[] }) {
  if (months.length === 0) {
    return <p className="analytics-empty">No fan data yet. Seed test data to see a chart.</p>;
  }

  const w = 400;
  const h = 140;
  const padL = 36;
  const padB = 28;
  const chartW = w - padL - 8;
  const chartH = h - padB - 8;
  const baseY = 8 + chartH;

  // Compute cumulative totals
  const cumulative = months.reduce<{ month: string; total: number }[]>((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].total : 0;
    acc.push({ month: m.month, total: prev + m.count });
    return acc;
  }, []);

  const maxV = cumulative[cumulative.length - 1].total || 1;
  const toY = (v: number) => baseY - (v / maxV) * chartH;
  const xs = cumulative.map((_, i) => padL + (i / Math.max(cumulative.length - 1, 1)) * chartW);
  const pts = cumulative.map((c, i) => [xs[i], toY(c.total)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]},${baseY} L ${pts[0][0]},${baseY} Z`;

  const labelMonth = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  };

  return (
    <div className="analytics-chart-placeholder">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fanGrowthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.35)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fanGrowthGrad)" />
        <path d={line} fill="none" stroke="rgba(167, 139, 250, 0.9)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#1a1028" stroke="rgba(167, 139, 250, 0.9)" strokeWidth="2" />
        ))}
        {cumulative.map((c, i) => (
          <text key={i} x={xs[i]} y={h - 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="600">
            {labelMonth(c.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function EngagementChart({ engagement }: { engagement: number }) {
  const w = 400;
  const h = 140;
  const rate = Math.min(engagement, 100);
  const barW = (rate / 100) * (w - 16);

  return (
    <div className="analytics-chart-placeholder">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="engGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(45, 212, 191, 0.6)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0.8)" />
          </linearGradient>
        </defs>
        <rect x="8" y="52" width={w - 16} height="18" rx="9" fill="rgba(255,255,255,0.06)" />
        {barW > 0 && <rect x="8" y="52" width={barW} height="18" rx="9" fill="url(#engGrad)" />}
        <text x={w / 2} y="44" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="600" letterSpacing="0.1em">
          ENGAGEMENT RATE
        </text>
        <text x={w / 2} y="96" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800">
          {rate.toFixed(0)}%
        </text>
        <text x={w / 2} y="116" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600">
          fans subscribed in last 30 days / total fans
        </text>
      </svg>
    </div>
  );
}

function RevenueBreakdownChart({ items, avgSubAmount }: { items: { price: number; revenue: number }[]; avgSubAmount: number }) {
  const padL = 44;
  const padB = 36;
  const w = 400;
  const h = 220;
  const chartW = w - padL - 16;
  const chartH = h - padB - 24;
  const baseY = 24 + chartH;

  if (items.length === 0) {
    return <p className="analytics-empty">No revenue data yet.</p>;
  }

  const maxV = Math.max(...items.map((i) => i.revenue)) * 1.15 || 1;
  const toY = (v: number) => baseY - (v / maxV) * chartH;
  const xs = items.map((_, i) => padL + (i / Math.max(items.length - 1, 1)) * chartW);
  const pts = items.map((item, i) => [xs[i], toY(item.revenue)] as const);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');

  const ticks = [...new Set([0, Math.round(maxV / 2), Math.round(maxV)])];
  const peakIdx = items.reduce((best, cur, i) => (cur.revenue > items[best].revenue ? i : best), 0);
  const [px, py] = pts[peakIdx];

  return (
    <div className="rev-chart-wrap" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="rev-chart-svg">
        {ticks.map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 12} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="10" fontWeight="600">
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
              </text>
            </g>
          );
        })}
        <path d={d} fill="none" stroke="rgba(192, 167, 255, 0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, i) => (
          <text key={item.price} x={xs[i]} y={h - 10} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontWeight="600">
            ${item.price.toFixed(2)}
          </text>
        ))}
        {items.length > 1 && (
          <>
            <rect x={px - 72} y={py - 36} width="144" height="28" rx="6" fill="rgba(40, 32, 65, 0.95)" stroke="rgba(167, 139, 250, 0.35)" />
            <text x={px} y={py - 16} textAnchor="middle" fill="#e9d5ff" fontSize="8" fontWeight="700" letterSpacing="0.06em">
              AVERAGE FAN PRICE
            </text>
            <text x={px} y={py - 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">
              ${avgSubAmount.toFixed(2)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

function NewReturningChart({ newRevenue, returningRevenue }: { newRevenue: number; returningRevenue: number }) {
  const w = 360;
  const h = 200;
  const maxH = 120;
  const baseY = 160;
  const cx1 = 110;
  const cx2 = 250;
  const bw = 56;
  const maxVal = Math.max(newRevenue, returningRevenue, 1);
  const newH = (newRevenue / maxVal) * maxH;
  const retH = (returningRevenue / maxVal) * maxH;
  const ticks = [...new Set([0, Math.round(maxVal / 2), Math.round(maxVal)])];

  return (
    <div className="rev-chart-wrap rev-chart-wrap--bars" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="rev-chart-svg">
        <defs>
          <linearGradient id="revBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = baseY - (tick / maxVal) * maxH;
          return (
            <g key={tick}>
              <line x1={40} y1={y} x2={w - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="10" fontWeight="600">
                {tick >= 1000 ? `$${(tick / 1000).toFixed(1)}k` : `$${tick}`}
              </text>
            </g>
          );
        })}
        {newH > 0 && <rect x={cx1 - bw / 2} y={baseY - newH} width={bw} height={newH} rx="8" fill="url(#revBarGrad)" />}
        {retH > 0 && <rect x={cx2 - bw / 2} y={baseY - retH} width={bw} height={retH} rx="8" fill="url(#revBarGrad)" />}
        <text x={cx1} y={baseY + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">
          New Fans
        </text>
        <text x={cx2} y={baseY + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" fontWeight="600">
          Returning Fans
        </text>
      </svg>
    </div>
  );
}

interface PostRow {
  id: string;
  name: string;
  file_type: string;
  status: string;
  review_status: string | null;
  posted_date: string | null;
  created_at: string;
}

const COUNTRY_FLAG: Record<string, string> = {
  usa: '🇺🇸', uk: '🇬🇧', nigeria: '🇳🇬', canada: '🇨🇦',
  japan: '🇯🇵', germany: '🇩🇪', australia: '🇦🇺', france: '🇫🇷', brazil: '🇧🇷',
};
function countryFlag(country: string | null) {
  return COUNTRY_FLAG[(country ?? '').toLowerCase()] ?? '';
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function statusLabel(post: PostRow) {
  if (post.review_status === 'accepted') return { text: 'Live', cls: 'analytics-badge--live' };
  if (post.review_status === 'pending') return { text: 'In Review', cls: 'analytics-badge--review' };
  if (post.review_status === 'declined') return { text: 'Declined', cls: 'analytics-badge--declined' };
  if (post.status === 'submitted') return { text: 'Submitted', cls: 'analytics-badge--review' };
  return { text: 'Draft', cls: 'analytics-badge--draft' };
}

function OverviewTab({ insights, posts }: { insights: InsightsData | null; posts: PostRow[] }) {
  const totalFans = insights ? fmt(insights.totalFans ?? 0) : '—';
  const avgSub = insights ? `$${(insights.avgSubAmount ?? 0).toFixed(2)}` : '—';
  const engagement = insights ? `${(insights.engagement ?? 0).toFixed(0)}%` : '—';
  const totalViews = insights ? fmt(insights.totalViews ?? 0) : '—';
  const fanDelta = insights ? `+${insights.newFansThisMonth} this month` : '';
  const prevDelta = insights && insights.newFansPrevMonth > 0
    ? `vs ${insights.newFansPrevMonth} last month`
    : '';

  return (
    <>
      <div className="analytics-stats-row">
        <StatCard label="Total Fans" value={totalFans} trend={fanDelta} tone="blue" icon={<IconUsers />} />
        <StatCard label="Avg. Sub Amount" value={avgSub} trend={prevDelta} tone="teal" icon={<IconDollar />} />
        <StatCard label="Engagement Rate" value={engagement} trend="" tone="green" icon={<IconChart />} />
        <StatCard label="Total Views" value={totalViews} trend="" tone="yellow" icon={<IconEye />} />
      </div>

      <section className="analytics-panel">
        <h2 className="analytics-panel-title">Recent Content</h2>
        {posts.length === 0 ? (
          <p className="analytics-empty">No content yet. Create a post to see it here.</p>
        ) : (
          posts.slice(0, 5).map((post) => {
            const badge = statusLabel(post);
            return (
              <div key={post.id} className="analytics-content-row">
                <div className="analytics-content-left">
                  <span className="analytics-content-title">{post.name}</span>
                  <span className="analytics-content-type">{post.file_type}</span>
                </div>
                <div className="analytics-content-metrics">
                  <span className={`analytics-badge ${badge.cls}`}>{badge.text}</span>
                  {post.posted_date && (
                    <div className="analytics-metric">
                      Date
                      <strong>{post.posted_date}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <div className="analytics-bottom-grid">
        <div className="analytics-chart-card">
          <h3>Fan Growth</h3>
          <FanGrowthChart months={insights?.fanGrowthByMonth ?? []} />
        </div>
        <div className="analytics-chart-card">
          <h3>Engagement Rate</h3>
          <EngagementChart engagement={insights?.engagement ?? 0} />
        </div>
      </div>
    </>
  );
}

function RevenueTab({ revenue }: { revenue: RevenueData | null }) {
  const total = revenue ? `$${revenue.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  const avg = revenue ? `$${revenue.avgSubAmount.toFixed(2)}` : '—';
  const newRev = revenue ? `$${revenue.newRevenue.toFixed(2)}` : '—';
  const retRev = revenue ? `$${revenue.returningRevenue.toFixed(2)}` : '—';

  return (
    <>
      <div className="analytics-stats-row">
        <StatCard label="Total Revenue" value={total} trend="" tone="purple" icon={<IconWallet />} />
        <StatCard label="Avg. Sub Price" value={avg} trend="" tone="blue" icon={<IconUsers />} />
        <StatCard label="New Fan Revenue" value={newRev} trend="last 30 days" tone="red" icon={<IconVideoCamera />} />
        <StatCard label="Returning Revenue" value={retRev} trend="older fans" tone="green" icon={<IconVinyl />} />
      </div>

      <div className="rev-mid-grid">
        <div className="analytics-chart-card rev-card-tall">
          <h3>Revenue by Price Point</h3>
          <RevenueBreakdownChart
            items={revenue?.revenueByPrice ?? []}
            avgSubAmount={revenue?.avgSubAmount ?? 0}
          />
        </div>
        <div className="analytics-chart-card rev-card-list">
          <h3>Top Cities</h3>
          {!revenue || revenue.topCities.length === 0 ? (
            <p className="analytics-empty">No fan location data yet.</p>
          ) : (
            <ul className="rev-rank-list">
              {revenue.topCities.map((row, i) => (
                <li key={i} className="rev-rank-row">
                  <span className="rev-rank-num">{i + 1}.</span>
                  <span className="rev-rank-label">
                    {row.label} {countryFlag(row.country)}
                  </span>
                  <span className="rev-rank-amount">${row.revenue.toFixed(2)} / mo</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="analytics-chart-card rev-card-list">
          <h3>Top Fans</h3>
          {!revenue || revenue.topFans.length === 0 ? (
            <p className="analytics-empty">No fans yet.</p>
          ) : (
            <ul className="rev-rank-list">
              {revenue.topFans.map((fan, i) => (
                <li key={i} className="rev-rank-row rev-rank-row--fan">
                  <span className="rev-rank-num">{i + 1}.</span>
                  <span className="rev-rank-label">
                    {fan.display_name ?? 'Anonymous'} {countryFlag(fan.country)}
                  </span>
                  <span className="rev-rank-amount">${fan.monthly_amount.toFixed(2)} / mo</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="analytics-bottom-grid rev-bottom-pair">
        <div className="analytics-chart-card rev-card-tall">
          <h3>New v. Returning Revenue</h3>
          <NewReturningChart
            newRevenue={revenue?.newRevenue ?? 0}
            returningRevenue={revenue?.returningRevenue ?? 0}
          />
        </div>
      </div>
    </>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const loadInsights = () => {
    const token = getToken();
    if (!token) return;
    console.log('[Analytics] Fetching insights…');
    fetch('/api/artist/insights', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          console.log('[Analytics] Insights loaded:', data);
          setInsights(data);
        }
      })
      .catch(() => {});
    console.log('[Analytics] Fetching revenue…');
    fetch('/api/artist/revenue', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          console.log('[Analytics] Revenue loaded:', data);
          setRevenue(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadInsights();
    const token = getToken();
    if (!token) return;
    fetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PostRow[]) => setPosts(data.sort((a, b) => b.created_at.localeCompare(a.created_at))))
      .catch(() => {});
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      console.log('[Seed] Fetching POST /api/dev/seed-fans…');
      const r = await fetch('/api/dev/seed-fans', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      console.log('[Seed] Response:', d);
      setSeedMsg(d.message ?? (r.ok ? 'Seeded!' : 'Failed'));
      if (r.ok) {
        console.log('[Seed] Reloading analytics data…');
        loadInsights();
      }
    } catch {
      setSeedMsg('Error seeding data');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      console.log('[Seed] Fetching DELETE /api/dev/seed-fans…');
      const r = await fetch('/api/dev/seed-fans', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      console.log('[Seed] Response:', d);
      setSeedMsg(d.message ?? (r.ok ? 'Cleared!' : 'Failed'));
      if (r.ok) {
        console.log('[Seed] Reloading analytics data…');
        loadInsights();
      }
    } catch {
      setSeedMsg('Error clearing data');
    } finally {
      setSeeding(false);
    }
  };

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
            <button type="button" className="analytics-toolbar-btn analytics-seed-btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Working…' : 'Seed Test Data'}
            </button>
            <button type="button" className="analytics-toolbar-btn analytics-clear-btn" onClick={handleClearSeed} disabled={seeding}>
              Clear Seed Data
            </button>
            {seedMsg && <span className="analytics-seed-msg">{seedMsg}</span>}
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

      {tab === 'overview' && <OverviewTab insights={insights} posts={posts} />}
      {tab === 'revenue' && <RevenueTab revenue={revenue} />}
    </div>
  );
}
