const COMPLETE_STATES = new Set(['COMPLETE', 'CONFIRMED']);

export function parseCircleUsdcBalance(raw, usdcTokenId) {
  if (!raw || typeof raw !== 'object') return null;

  const payload = raw.data?.tokenBalances ? raw.data : raw;

  if (payload.availableAmount?.amount != null) {
    return {
      amount: String(payload.availableAmount.amount),
      currency: payload.availableAmount.currency ?? 'USDC',
    };
  }

  const balances = payload.tokenBalances ?? [];
  const usdcEntry = balances.find((entry) => {
    if (usdcTokenId && entry?.token?.id === usdcTokenId) return true;
    if (usdcTokenId && entry?.tokenId === usdcTokenId) return true;
    const name = (entry?.token?.name ?? '').toUpperCase();
    return name.includes('USDC') || name.includes('USD COIN');
  });

  if (!usdcEntry) return null;

  return {
    amount: String(usdcEntry.amount ?? '0'),
    currency: 'USDC',
  };
}

export function normalizeCircleTransaction(tx, usdcTokenId) {
  const amount = tx.amounts?.[0] ?? '0';
  const isUsdc = Boolean(usdcTokenId && tx.tokenId === usdcTokenId);
  const direction = tx.transactionType === 'OUTBOUND' ? 'out' : 'in';
  const failed = tx.state === 'FAILED';

  let label = 'Transfer';
  if (isUsdc) {
    label = direction === 'out' ? 'Withdrawal' : 'USDC Deposit';
  } else if (direction === 'in') {
    label = 'SOL Deposit';
  } else {
    label = 'Outbound Transfer';
  }

  if (failed) label += ' (Failed)';

  const currency = isUsdc ? 'USDC' : 'SOL';
  const formattedAmount = isUsdc
    ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 4 })} SOL`;

  return {
    id: tx.id,
    label,
    amount: formattedAmount,
    direction,
    state: tx.state,
    failed,
    currency,
    rawAmount: Number(amount) || 0,
    date: tx.createDate,
    txHash: tx.txHash ?? null,
  };
}

export function buildBalanceChart(transactions, currentUsdcBalance, usdcTokenId, days = 12) {
  const completeUsdc = transactions
    .filter((tx) => COMPLETE_STATES.has(tx.state) && usdcTokenId && tx.tokenId === usdcTokenId)
    .sort((a, b) => new Date(a.createDate) - new Date(b.createDate));

  const balanceByDay = new Map();
  let running = 0;
  for (const tx of completeUsdc) {
    const delta = tx.transactionType === 'INBOUND'
      ? Number(tx.amounts?.[0] ?? 0)
      : -Number(tx.amounts?.[0] ?? 0);
    running += delta;
    balanceByDay.set(tx.createDate.slice(0, 10), running);
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  balanceByDay.set(todayKey, currentUsdcBalance);

  const labels = [];
  const values = [];
  let lastBalance = 0;

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (balanceByDay.has(key)) lastBalance = balanceByDay.get(key);
    values.push(lastBalance);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase());
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = 600 / Math.max(days - 1, 1);
  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return [x, y];
  });

  return { labels, values, points };
}
