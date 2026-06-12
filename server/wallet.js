const PAYMENTS_URL = process.env.PAYMENTS_URL ?? 'http://localhost:5001';

function parseBlockchains() {
  return (process.env.ARTIST_WALLET_BLOCKCHAINS ?? 'SOL-DEVNET')
    .split(',')
    .map((chain) => chain.trim())
    .filter(Boolean);
}

/**
 * Creates a Circle developer-controlled wallet for an artist via the payments API.
 * Returns { created, circleWalletId?, walletChain?, reason?, error? }.
 */
export async function provisionArtistWallet() {
  const walletSetId = process.env.ARTIST_WALLET_SET_ID;
  const blockchains = parseBlockchains();

  if (!walletSetId) {
    console.warn('[wallet] ARTIST_WALLET_SET_ID not set — skipping Circle wallet creation');
    return { created: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch(`${PAYMENTS_URL}/joko/wallet/create-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletSetId, blockchains, count: 1 }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[wallet] Circle wallet creation failed:', data);
      return {
        created: false,
        reason: 'api_error',
        error: data.error ?? `Payments API returned ${res.status}`,
      };
    }

    const circleWalletId = data.walletIds?.[0];
    if (!circleWalletId) {
      console.error('[wallet] Payments API returned no wallet IDs:', data);
      return { created: false, reason: 'no_wallet_id' };
    }

    return { created: true, circleWalletId, walletChain: blockchains[0] };
  } catch (err) {
    console.error('[wallet] Payments service unreachable:', err.message);
    return { created: false, reason: 'unreachable', error: err.message };
  }
}

export function saveArtistWallet(db, artistId, { circleWalletId, walletChain }) {
  db.prepare(`
    UPDATE Artist
    SET circle_wallet_id = ?, wallet_chain = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(circleWalletId, walletChain, artistId);
}
