import { useState, useEffect } from 'react';
import { getToken } from '../auth';
import './Monetization.css';

function BalanceChart() {
  /* 12 points, sharp peaks/valleys — minimal chart, no grid */
  const points = [
    [0, 85],
    [54.5, 45],
    [109, 72],
    [163.5, 28],
    [218, 68],
    [272.5, 38],
    [327, 88],
    [381.5, 52],
    [436, 78],
    [490.5, 35],
    [545, 62],
    [600, 48],
  ];
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');

  const labels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  });

  return (
    <div className="monet-chart-wrap">
      <svg viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden>
        <path
          d={d}
          fill="none"
          stroke="rgba(192, 167, 255, 0.95)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="monet-chart-labels">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function IconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function IconSubscription() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconMerch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconTransferOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 17L17 7M17 7H9M17 7V15" />
    </svg>
  );
}

const TRANSACTIONS = [
  { id: '1', label: 'Subscription', amount: '$8.99', direction: 'in' as const, Icon: IconSubscription },
  { id: '2', label: 'Merchandise Sale', amount: '$31.17', direction: 'in' as const, Icon: IconMerch },
  { id: '3', label: 'Money Transfer', amount: '$1,100', direction: 'out' as const, Icon: IconTransferOut },
  { id: '4', label: 'Subscription', amount: '$8.99', direction: 'in' as const, Icon: IconSubscription },
  { id: '5', label: 'Merchandise Sale', amount: '$54.00', direction: 'in' as const, Icon: IconMerch },
];

interface WalletInfo {
  walletAddress: string | null;
  circleWalletId: string | null;
  walletChain: string | null;
  balance: unknown;
}

type ModalStatus = { type: 'success' | 'error'; message: string } | null;

export default function Monetization() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ModalStatus>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setWalletInfo(data); })
      .catch(() => {});
  }, []);

  const handleConnectWallet = async () => {
    const trimmedAddr = newWalletAddress.trim();
    if (!trimmedAddr) return;
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ walletAddress: trimmedAddr }),
      });
      if (r.ok) {
        setWalletInfo((prev) => ({ ...prev!, walletAddress: trimmedAddr }));
        setStatus({ type: 'success', message: 'Wallet saved successfully.' });
        setNewWalletAddress('');
      } else {
        const d = await r.json();
        setStatus({ type: 'error', message: d.error ?? 'Failed to save wallet.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt <= 0) return;
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      const d = await r.json();
      if (r.ok) {
        setStatus({ type: 'success', message: `Transfer of ${withdrawAmount} USDC initiated successfully.` });
        setWithdrawAmount('');
      } else {
        setStatus({ type: 'error', message: d.error ?? 'Transfer failed.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const closeTransfer = () => { setTransferOpen(false); setStatus(null); setWithdrawAmount(''); };
  const closeWallet = () => { setWalletOpen(false); setStatus(null); setNewWalletAddress(''); };

  return (
    <div className="monet-page">
      <header className="monet-header">
        <h1 className="monet-title">Monetization</h1>
      </header>

      <section className="monet-balance-block">
        <p className="monet-balance-label">Your Balance</p>
        <p className="monet-balance-value">$12,000</p>
        <BalanceChart />
      </section>

      <div className="monet-actions">
        <button
          type="button"
          className="monet-transfer"
          onClick={() => { setTransferOpen(true); setStatus(null); }}
        >
          Transfer Money
        </button>
        <button
          type="button"
          className="monet-wallet"
          onClick={() => { setWalletOpen(true); setStatus(null); }}
        >
          <IconWallet />
          Manage Wallet
        </button>
      </div>

      <section className="monet-tx-panel">
        <h2 className="monet-tx-title">Recent Transactions</h2>
        {TRANSACTIONS.map((tx) => {
          const Icon = tx.Icon;
          return (
            <div key={tx.id} className="monet-tx-row">
              <div className="monet-tx-left">
                <div className={`monet-tx-icon monet-tx-icon--${tx.direction === 'in' ? 'in' : 'out'}`}>
                  <Icon />
                </div>
                <span className="monet-tx-label">{tx.label}</span>
              </div>
              <span className={`monet-tx-amount monet-tx-amount--${tx.direction === 'in' ? 'in' : 'out'}`}>
                {tx.direction === 'in' ? '+' : '−'}
                {tx.amount}
              </span>
            </div>
          );
        })}
      </section>

      {/* Transfer Money Modal */}
      {transferOpen && (
        <div className="monet-modal-overlay" onClick={closeTransfer}>
          <div className="monet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monet-modal-header">
              <span className="monet-modal-title">Transfer Money</span>
              <button className="monet-modal-close" onClick={closeTransfer} aria-label="Close">✕</button>
            </div>
            <div className="monet-modal-body">
              {walletInfo?.walletAddress ? (
                <div className="monet-modal-info">
                  <span className="monet-modal-info-label">Destination (USDC)</span>
                  <span className="monet-modal-info-value monet-addr">{walletInfo.walletAddress}</span>
                </div>
              ) : (
                <p className="monet-modal-warning">
                  No withdrawal wallet connected. Add one via Manage Wallet first.
                </p>
              )}
              <label className="monet-modal-label" htmlFor="withdraw-amount">Amount (USDC)</label>
              <input
                id="withdraw-amount"
                className="monet-modal-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!walletInfo?.walletAddress || loading}
              />
              {status && (
                <p className={`monet-modal-status monet-modal-status--${status.type}`}>{status.message}</p>
              )}
              <button
                className="monet-modal-btn-primary"
                onClick={handleWithdraw}
                disabled={!walletInfo?.walletAddress || !withdrawAmount || loading}
              >
                {loading ? 'Processing…' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Wallet Modal */}
      {walletOpen && (
        <div className="monet-modal-overlay" onClick={closeWallet}>
          <div className="monet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monet-modal-header">
              <span className="monet-modal-title">Manage Wallet</span>
              <button className="monet-modal-close" onClick={closeWallet} aria-label="Close">✕</button>
            </div>
            <div className="monet-modal-body">
              {walletInfo?.walletAddress ? (
                <div className="monet-modal-info">
                  <span className="monet-modal-info-label">USDC Withdrawal Address</span>
                  <span className="monet-modal-info-value monet-addr">{walletInfo.walletAddress}</span>
                </div>
              ) : (
                <p className="monet-modal-warning">No withdrawal address set yet.</p>
              )}
              <label className="monet-modal-label" htmlFor="wallet-address">
                {walletInfo?.walletAddress ? 'Update' : 'Set'} USDC Withdrawal Address
              </label>
              <input
                id="wallet-address"
                className="monet-modal-input"
                type="text"
                placeholder="Your USDC wallet address"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                disabled={loading}
              />
              {status && (
                <p className={`monet-modal-status monet-modal-status--${status.type}`}>{status.message}</p>
              )}
              <button
                className="monet-modal-btn-primary"
                onClick={handleConnectWallet}
                disabled={!newWalletAddress.trim() || loading}
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
