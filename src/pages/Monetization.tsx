import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../auth';
import './Monetization.css';

interface BalanceChartData {
  labels: string[];
  points: [number, number][];
  values: number[];
}

function BalanceChart({ chart }: { chart: BalanceChartData | null }) {
  const labels = chart?.labels ?? Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  });

  const points = chart?.points?.length
    ? chart.points
    : Array.from({ length: 12 }, (_, i) => [i * (600 / 11), 50] as [number, number]);

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
  const hasActivity = chart?.values?.some((v) => v > 0);

  return (
    <div className="monet-chart-wrap">
      {!hasActivity && (
        <p className="monet-chart-empty">USDC balance history will appear after your first deposit.</p>
      )}
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

function IconDeposit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function IconSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12h8M12 8v8" />
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

function txIcon(tx: WalletTransaction) {
  if (tx.currency === 'SOL') return IconSol;
  if (tx.direction === 'out') return IconTransferOut;
  return IconDeposit;
}

interface WalletInfo {
  walletAddress: string | null;
  circleWalletId: string | null;
  walletChain: string | null;
  balance: { amount?: string; currency?: string } | null;
  balanceChart: BalanceChartData | null;
  balanceError?: string | null;
}

interface WalletTransaction {
  id: string;
  label: string;
  amount: string;
  direction: 'in' | 'out';
  state: string;
  failed: boolean;
  currency: string;
  date: string;
  txHash: string | null;
}

type ModalStatus = { type: 'success' | 'error'; message: string } | null;

const MAINNET_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function WalletAddressHelpPanel() {
  return (
    <div className="monet-help-panel" role="region" aria-label="USDC wallet address instructions">
      <p className="monet-help-intro">
        Joko sends USDC on <strong>Solana Mainnet</strong> to the address you paste below.
        Use your wallet&apos;s Solana address — the same one you use to receive SOL also receives USDC.
      </p>

      <div className="monet-help-section">
        <h3 className="monet-help-heading">Option A — Existing wallet (Phantom or Solflare)</h3>
        <ol className="monet-help-steps">
          <li>Open your wallet extension or app (Phantom or Solflare).</li>
          <li>
            Switch to <strong>Solana Mainnet</strong> — not Devnet or Testnet.
            <ul className="monet-help-sublist">
              <li><strong>Phantom:</strong> Settings → Developer Settings → turn off Testnet Mode, or set network to Mainnet.</li>
              <li><strong>Solflare:</strong> Settings → General → Network → Mainnet.</li>
            </ul>
          </li>
          <li>Click <strong>Receive</strong> (or Deposit) and select <strong>Solana</strong>.</li>
          <li>Copy your wallet address — a long string starting with letters/numbers (about 32–44 characters).</li>
          <li>
            Make sure <strong>USD Coin (USDC)</strong> can appear in your wallet:
            <ul className="monet-help-sublist">
              <li>Go to <strong>Assets</strong> → <strong>Add token</strong> / <strong>Manage token list</strong>.</li>
              <li>Search <strong>USD Coin</strong> or paste mint: <code className="monet-help-code">{MAINNET_USDC_MINT}</code></li>
              <li>On mainnet, the token labeled <strong>USD Coin</strong> with mint <code className="monet-help-code">EPjF…Dt1v</code> is correct.</li>
            </ul>
          </li>
          <li>Paste the copied address into the field below and click <strong>Save</strong>.</li>
        </ol>
      </div>

      <div className="monet-help-section">
        <h3 className="monet-help-heading">Option B — Create a new wallet</h3>
        <ol className="monet-help-steps">
          <li>
            Install a Solana wallet:
            <ul className="monet-help-sublist">
              <li><strong>Phantom:</strong> <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">phantom.app</a></li>
              <li><strong>Solflare:</strong> <a href="https://solflare.com/" target="_blank" rel="noopener noreferrer">solflare.com</a></li>
            </ul>
          </li>
          <li>Choose <strong>Create a new wallet</strong> and write down your recovery phrase. Store it somewhere safe — anyone with it can access your funds.</li>
          <li>Set the network to <strong>Solana Mainnet</strong> (see Option A, step 2).</li>
          <li>Open <strong>Receive → Solana</strong> and copy your new address.</li>
          <li>Add <strong>USD Coin (USDC)</strong> to your token list (see Option A, step 5).</li>
          <li>Paste the address here and click <strong>Save</strong>.</li>
        </ol>
      </div>

      <p className="monet-help-note">
        Your first withdrawal may require a small amount of SOL in that wallet to cover network fees if your USDC account does not exist yet.
        Adding USDC to your wallet beforehand avoids most setup issues.
      </p>
    </div>
  );
}

export default function Monetization() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [status, setStatus] = useState<ModalStatus>(null);
  const [walletHelpOpen, setWalletHelpOpen] = useState(false);

  const loadWallet = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setWalletLoading(true);
    try {
      const r = await fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setWalletInfo(await r.json());
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setTxLoading(true);
    try {
      const r = await fetch('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setTransactions(data.transactions ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setTxLoading(false);
    }
  }, []);

  const refreshWalletData = useCallback(async () => {
    await Promise.all([loadWallet(), loadTransactions()]);
  }, [loadWallet, loadTransactions]);

  useEffect(() => {
    refreshWalletData();
  }, [refreshWalletData]);

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
        await refreshWalletData();
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
  const closeWallet = () => {
    setWalletOpen(false);
    setStatus(null);
    setNewWalletAddress('');
    setWalletHelpOpen(false);
  };

  return (
    <div className="monet-page">
      <header className="monet-header">
        <h1 className="monet-title">Monetization</h1>
      </header>

      <section className="monet-balance-block">
        <p className="monet-balance-label">Your Balance</p>
        <p className="monet-balance-value">
          {walletInfo?.balance?.amount != null
            ? `$${Number(walletInfo.balance.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${walletInfo.balance.currency ?? 'USDC'}`
            : walletLoading
              ? 'Loading…'
              : walletInfo?.balanceError
                ? 'Unavailable'
                : walletInfo?.circleWalletId
                  ? '$0.00 USDC'
                  : '—'}
        </p>
        {walletInfo?.balanceError && !walletLoading && (
          <p className="monet-balance-error">{walletInfo.balanceError}</p>
        )}
        {walletInfo?.circleWalletId && (
          <p className="monet-wallet-id">Circle Wallet: {walletInfo.circleWalletId}</p>
        )}
        <BalanceChart chart={walletInfo?.balanceChart ?? null} />
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
        {txLoading && transactions.length === 0 && (
          <p className="monet-tx-empty">Loading transactions…</p>
        )}
        {!txLoading && transactions.length === 0 && (
          <p className="monet-tx-empty">No Circle wallet transactions yet.</p>
        )}
        {transactions.map((tx) => {
          const Icon = txIcon(tx);
          const amountClass = tx.failed
            ? 'monet-tx-amount--failed'
            : `monet-tx-amount--${tx.direction === 'in' ? 'in' : 'out'}`;
          return (
            <div key={tx.id} className={`monet-tx-row${tx.failed ? ' monet-tx-row--failed' : ''}`}>
              <div className="monet-tx-left">
                <div className={`monet-tx-icon monet-tx-icon--${tx.failed ? 'failed' : tx.direction === 'in' ? 'in' : 'out'}`}>
                  <Icon />
                </div>
                <div className="monet-tx-meta">
                  <span className="monet-tx-label">{tx.label}</span>
                  <span className="monet-tx-date">
                    {new Date(tx.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <span className={`monet-tx-amount ${amountClass}`}>
                {!tx.failed && (tx.direction === 'in' ? '+' : '−')}
                {tx.amount}
              </span>
            </div>
          );
        })}
      </section>

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
              <div className="monet-wallet-field">
                <div className="monet-modal-label-row">
                  <label className="monet-modal-label" htmlFor="wallet-address">
                    {walletInfo?.walletAddress ? 'Update' : 'Set'} USDC Withdrawal Address
                  </label>
                  <button
                    type="button"
                    className={`monet-help-icon${walletHelpOpen ? ' monet-help-icon--active' : ''}`}
                    onClick={() => setWalletHelpOpen((v) => !v)}
                    aria-label="How to find your USDC wallet address"
                    aria-expanded={walletHelpOpen}
                  >
                    <IconInfo />
                  </button>
                </div>
                {walletHelpOpen && <WalletAddressHelpPanel />}
                <input
                  id="wallet-address"
                  className="monet-modal-input"
                  type="text"
                  placeholder="Your Solana USDC wallet address"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
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
