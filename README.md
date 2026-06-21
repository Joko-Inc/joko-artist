# Joko Artist

Artist-facing web app for Joko: **onboarding**, **email verification**, **password reset**, content, analytics, and **Monetization** (Circle USDC balance, transactions, withdrawals).

| Service | Port | Command |
|---------|------|---------|
| Vite frontend | `5173` | `npm run dev` |
| Express API + SQLite | `3001` | `npm run server` |
| Payments backend (Circle) | `5001` | see [payments README](../Joko-Payments-Infrastructure-and-Smartcontracts/backend/README.md) |

---

## Environment setup (full walkthrough)

Copy the template and work through each section:

```bash
cd joko-artist
cp .env.example .env
```

Reference: **[`.env.example`](.env.example)** — every variable is documented inline.

### What each feature needs

| Feature | Required env vars | Notes |
|---------|-------------------|--------|
| Login / JWT | `JWT_SECRET` | Always required |
| Email verification links | `APP_URL` | Must be `http://localhost:5173` locally |
| Sending verification email | `SMTP_*` | Optional — link logged to server console if omitted |
| Forgot password email | `SMTP_*`, `APP_URL` | Same as verification; no verified-email gate |
| Create Circle wallet (onboarding) | `PAYMENTS_URL`, `ARTIST_WALLET_SET_ID`, `ARTIST_WALLET_BLOCKCHAINS` | Payments backend must be running |
| Monetization balance / chart / txs | Above + payments backend up | Proxies Circle via `:5001` |
| USDC withdrawal | Above + `USDC_TOKEN_ID` | Plus artist `wallet_address` in Manage Wallet |

---

### Step 1 — Core joko-artist vars

```bash
JWT_SECRET=local-dev-secret          # any string for dev; use random in prod
APP_URL=http://localhost:5173        # MUST match Vite (strictPort: true)
```

`APP_URL` is used in:

- Signup verification: `{APP_URL}/api/auth/verify-email?token=...`
- Password reset: `{APP_URL}/reset-password?token=...`

If email links 404, you likely have `APP_URL=http://localhost:3000` or the wrong port.

---

### Step 2 — Email (Resend)

**Signup** sends a verification email after onboarding. **Login → Forgot password** sends a reset link. Both use [`server/email.js`](server/email.js).

#### Option A — With Resend (recommended)

1. Create an account at [resend.com](https://resend.com).
2. **API Keys** → create a key → set `SMTP_PASS=re_...`.
3. In `joko-artist/.env`:

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=Joko <onboarding@resend.dev>
```

4. **Sandbox rule:** until you [verify a domain](https://resend.com/domains), `onboarding@resend.dev` only delivers to **the email on your Resend account**. Sign up during testing with that email, or check the server console for the link.
5. If Resend rejects a send, signup still succeeds — the API returns `emailSent: false` and logs the verification URL in the **`npm run server`** terminal.

#### Option B — No SMTP (console links only)

Leave `SMTP_PASS` empty. After signup or forgot-password, copy the link from the server terminal:

```text
[email] SMTP not configured — verification link for you@example.com
http://localhost:5173/api/auth/verify-email?token=...
```

#### Test the flows

1. **Verify email:** complete onboarding → open link → account marked verified → sign in.
2. **Forgot password:** Login → Forgot password → enter email → open reset link → set new password.

---

### Step 3 — Payments backend (Circle)

Monetization and **Create your Wallet** depend on the payments API.

```bash
cd ../Joko-Payments-Infrastructure-and-Smartcontracts/backend
cp .env.example .env
```

`backend/.env`:

```bash
CIRCLE_API_KEY=...           # Circle Developer Console → API key
CIRCLE_ENTITY_SECRET=...     # Console, or: npx tsx register-entity-secret.ts
PORT=5001
```

Start it (from `backend/`):

```bash
npm install && npm run dev
# → Backend running on http://localhost:5001
```

**First-time entity secret** (if you don’t have one):

```bash
# CIRCLE_API_KEY must already be in backend/.env
npx tsx register-entity-secret.ts
# Writes CIRCLE_ENTITY_SECRET to .env and saves recovery file to backend/recovery/
# NEVER commit backend/recovery/ or backend/.env
```

---

### Step 4 — Artist wallet set

With payments backend running:

```bash
curl -X POST http://localhost:5001/joko/wallet/wallet-set \
  -H "Content-Type: application/json" \
  -d '{"name": "Artist Set"}'
```

Copy `walletSetId` into joko-artist `.env`:

```bash
PAYMENTS_URL=http://localhost:5001
ARTIST_WALLET_SET_ID=<walletSetId from response>
ARTIST_WALLET_BLOCKCHAINS=SOL-DEVNET
```

Also stored in `backend/storage/wallets.json`. If wallet creation fails, refresh this ID (stale sets cause Circle errors).

---

### Step 5 — USDC token ID (withdrawals)

Required for **Transfer Money**. This is Circle’s **token UUID**, not the Solana mint address.

1. Complete onboarding and click **Create your Wallet** (or use Monetization after signup).
2. Note the Circle wallet ID on the Monetization page.
3. Fetch balances:

```bash
curl http://localhost:5001/joko/wallet/balance/<circleWalletId>
```

4. Copy `tokenBalances[].token.id` for the **USD Coin** entry → `USDC_TOKEN_ID`.

Devnet example: `8fb3cadb-0ef4-573d-8fcd-e194f961c728`

---

### Step 6 — Run joko-artist

```bash
# Terminal 2
cd joko-artist
npm install && npm run server    # :3001

# Terminal 3
npm run dev                      # :5173, proxies /api → :3001
```

Open [http://localhost:5173](http://localhost:5173).

---

### Example complete `.env` (local devnet)

```bash
JWT_SECRET=local-dev-secret
APP_URL=http://localhost:5173

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_resend_key
SMTP_FROM=Joko <onboarding@resend.dev>

PAYMENTS_URL=http://localhost:5001
ARTIST_WALLET_SET_ID=342c6f15-a709-5dc8-891e-68b5715d7085
ARTIST_WALLET_BLOCKCHAINS=SOL-DEVNET
USDC_TOKEN_ID=8fb3cadb-0ef4-573d-8fcd-e194f961c728
```

Replace IDs with your own Circle values.

---

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Verification email never arrives | Use Resend account email for signup, or copy link from server console |
| Email link 404 | Set `APP_URL=http://localhost:5173` |
| Balance **Loading…** / **Unavailable** | Start payments backend on `:5001`; check `PAYMENTS_URL` |
| **Create your Wallet** fails | Bad `ARTIST_WALLET_SET_ID` — recreate wallet set |
| Withdrawal fails | Set `USDC_TOKEN_ID`; recipient needs USDC token account (see devnet note below) |
| Signup works but email errors in UI | Normal with wrong Resend recipient — check console for `verifyUrl` |

---

## Features added (recent)

### Auth & email

- **Onboarding** with profile, aesthetic uploads, username/password.
- **Email verification** after signup (`GET /api/auth/verify-email`); resend via onboarding UI.
- **Forgot password** on login page → email or console link → `/reset-password`.
- Signup **does not** fail if email send fails — link always available in server logs when SMTP fails.
- Email verification **not** required before password reset.

### Wallet onboarding

- **Create your Wallet** provisions Circle wallet **only on button click** (not auto on signup).
- Removed Phantom “connect wallet” step from onboarding — external wallet is set later in Monetization.
- **Skip** still allowed during onboarding.

### Monetization (live Circle data)

- **Your Balance** — real USDC from Circle `tokenBalances`.
- **Balance chart** — last 12 days from completed USDC transfers.
- **Recent transactions** — Circle history (deposits, withdrawals, SOL, failed txs).
- **Transfer Money** — real outbound USDC via payments backend.
- **Manage Wallet** — save withdrawal address; **ⓘ help** with mainnet Phantom/Solflare steps.

### Other

- Vite fixed to **port 5173** (`strictPort: true`) so email links match.
- [`database/SCHEMA.md`](database/SCHEMA.md) — ER diagram including wallet columns.

---

## Architecture — two wallets

| Concept | DB column | Purpose |
|---------|-----------|---------|
| Platform wallet | `circle_wallet_id` | Circle-controlled; holds USDC on Joko |
| Withdrawal address | `wallet_address` | Artist’s Solana wallet (Phantom / Solflare) |

```
Monetization → POST /api/wallet/withdraw
  → POST /joko/wallet/charge-user
  → Circle createTransaction()
  → USDC to wallet_address
```

---

## Testing withdrawals (devnet)

1. Fund Circle wallet (Console or [faucet.circle.com](https://faucet.circle.com) → Solana Devnet).
2. **Manage Wallet** → paste devnet Solana address.
3. Before first payout, recipient needs a **devnet USDC account** — easiest: Circle faucet to that address, or add mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` in a devnet wallet (not mainnet `EPjF...` from search).
4. **Transfer Money** → confirm **Complete** in Circle Console + [Solscan devnet](https://solscan.io/?cluster=devnet).

Production: **Solana Mainnet** + USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` — see in-app **ⓘ** on Manage Wallet.

---

## Database schema

**[database/SCHEMA.md](database/SCHEMA.md)** — mermaid ER diagram, wallet columns, indexes.

Do **not** commit `database/database.sqlite` (local passwords, emails, wallet IDs). It is gitignored but may need `git rm --cached` if tracked from an older commit.

---

## API routes

### Auth & onboarding

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/onboard` | Sign up + send verification email |
| GET | `/api/auth/verify-email` | Verify email from link |
| POST | `/api/auth/resend-verification` | Resend verification |
| POST | `/api/auth/provision-wallet` | Create Circle wallet (onboarding button) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send password reset |
| POST | `/api/auth/reset-password` | Set new password |
| GET | `/api/artist/me` | Current profile |

### Wallet / monetization

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wallet` | Balance + chart data |
| GET | `/api/wallet/transactions` | Transaction list |
| POST | `/api/wallet/connect` | Save withdrawal address |
| POST | `/api/wallet/withdraw` | USDC transfer |
| POST | `/api/wallet/provision` | Create Circle wallet if missing |

---

## Project layout

```
joko-artist/
├── src/pages/
│   ├── Onboarding.tsx          # Signup, wallet create, verify pending
│   ├── Login.tsx               # Sign in + forgot password
│   ├── ResetPassword.tsx
│   └── Monetization.tsx        # Balance, chart, txs, transfer, wallet help
├── server/
│   ├── index.js                # API + migrations
│   ├── email.js                # Resend / console fallback
│   ├── wallet.js               # Circle provisioning
│   └── circleWallet.js         # Balance parse, txs, chart
├── database/SCHEMA.md
└── .env.example
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend `:5173` |
| `npm run server` | API `:3001` |
| `npm run build` | Production build |

---

## Security — do not commit

| Path | Why |
|------|-----|
| `.env` | API keys, JWT secret, Resend key |
| `database/database.sqlite` | Password hashes, emails, wallet addresses |
| `backend/.env` | Circle credentials |
| `backend/recovery/` | Circle entity secret recovery files |

---

## QA checklist

**Email:** signup → verify link → login works; forgot password → reset works.

**Wallet setup:** Create your Wallet → `circle_wallet_id` on Monetization; inbound USDC in Circle Console.

**Withdrawal:** Manage Wallet → Transfer Money → Circle **Complete** + Solscan tx; UI balance/transactions match Console.
