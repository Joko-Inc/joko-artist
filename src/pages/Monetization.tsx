import { useState } from 'react';
import './Monetization.css';

const AVAILABLE_BALANCE = 12_000;

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

  const labels = ['FEB 1', 'FEB 2', 'FEB 3', 'FEB 4', 'FEB 5', 'FEB 6', 'FEB 7', 'FEB 8', 'FEB 9', 'FEB 10', 'FEB 11', 'FEB 12'];

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

function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function Monetization() {
  const [transferOpen, setTransferOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferOk, setTransferOk] = useState<string | null>(null);

  const closeTransfer = () => {
    setTransferOpen(false);
    setAmountInput('');
    setTransferError(null);
    setTransferOk(null);
  };

  const submitTransfer = () => {
    setTransferError(null);
    setTransferOk(null);
    const n = parseAmountInput(amountInput);
    if (n === null) {
      setTransferError('Enter a valid amount.');
      return;
    }
    if (n > AVAILABLE_BALANCE) {
      setTransferError('Amount exceeds your available balance.');
      return;
    }
    setTransferOk('Transfer submitted.');
    setAmountInput('');
    setTimeout(() => {
      closeTransfer();
    }, 1200);
  };

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
          onClick={() => {
            setTransferOpen(true);
            setTransferError(null);
            setTransferOk(null);
          }}
        >
          Transfer Money
        </button>
        <button type="button" className="monet-wallet">
          <IconWallet />
          Manage Wallet
        </button>
      </div>

      {transferOpen && (
        <section className="monet-transfer-inline" aria-labelledby="transfer-inline-title">
          <h2 id="transfer-inline-title" className="monet-transfer-inline-title">
            Transfer money
          </h2>
          <p className="monet-transfer-inline-desc">Enter the amount you want to transfer from your balance.</p>
          <div className="monet-transfer-field">
            <label htmlFor="transfer-amount">Amount</label>
            <input
              id="transfer-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="$ 0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
            <p className="monet-transfer-hint">Available balance: ${AVAILABLE_BALANCE.toLocaleString('en-US')}</p>
          </div>
          {transferError && <p className="monet-transfer-msg monet-transfer-msg--error">{transferError}</p>}
          {transferOk && <p className="monet-transfer-msg monet-transfer-msg--ok">{transferOk}</p>}
          <div className="monet-transfer-inline-actions">
            <button type="button" className="monet-transfer-cancel" onClick={closeTransfer}>
              Cancel
            </button>
            <button type="button" className="monet-transfer-submit" onClick={submitTransfer}>
              Confirm transfer
            </button>
          </div>
        </section>
      )}

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
    </div>
  );
}
