# Joko Artist — SQLite Schema

Database file: `database/database.sqlite` (or `DATA_DIR/database.sqlite` in production).

Migrations run automatically on server start in `server/index.js`. Manual SQL history lives in `database/migrate_*` files.

## Entity relationship diagram

```mermaid
erDiagram
    Artist ||--o{ Post : creates
    Artist ||--o{ Fan : has

    Artist {
        TEXT id PK
        TEXT name
        TEXT username UK
        TEXT password_hash
        TEXT email
        TEXT email_verified
        TEXT verification_token
        TEXT password_reset_token
        TEXT password_reset_expires
        TEXT first_name
        TEXT last_name
        TEXT artist_name
        TEXT slug UK
        TEXT profile_pic_url
        TEXT location
        TEXT phone
        TEXT artist_statement
        TEXT website
        TEXT instagram
        TEXT twitter
        TEXT music_links
        TEXT other_links
        TEXT aesthetic_urls
        REAL avg_sub_amount
        REAL engagement
        INTEGER total_views
        REAL monthly_revenue
        TEXT circle_wallet_id
        TEXT wallet_address
        TEXT wallet_chain
        TEXT created_at
        TEXT updated_at
    }

    Post {
        TEXT id PK
        TEXT artist_id FK
        TEXT name
        TEXT description
        TEXT thumbnail_url
        TEXT file_type
        TEXT file_url
        TEXT category
        TEXT posted_date
        TEXT status
        TEXT review_status
        INTEGER visible_to_fans
        REAL merch_price
        INTEGER merch_quantity
        TEXT created_at
        TEXT updated_at
    }

    Fan {
        TEXT id PK
        TEXT artist_id FK
        TEXT external_user_id
        TEXT display_name
        TEXT email
        TEXT city
        TEXT region
        TEXT country
        REAL monthly_amount
        TEXT subscribed_at
    }
```

## Wallet fields (Monetization)

| Column | Purpose |
|--------|---------|
| `circle_wallet_id` | Circle developer-controlled wallet ID (platform earnings). Created via onboarding **Create your Wallet** or `POST /api/wallet/provision`. |
| `wallet_address` | External Solana address for USDC withdrawals (Phantom, Solflare, etc.). Set in Monetization → **Manage Wallet**. |
| `wallet_chain` | Circle blockchain label (e.g. `SOL-DEVNET` for testing, `SOL` / mainnet in production). |

**Two-wallet model:** Circle holds USDC earned on-platform; `wallet_address` is where **Transfer Money** sends funds.

## Table summaries

### Artist

Core account, onboarding profile, auth, and wallet linkage.

### Post

Artist content (video, audio, merch, social). `review_status` + `visible_to_fans` gate fan-facing visibility.

### Fan

Per-artist fan/subscriber records. `external_user_id` + `artist_id` is unique when present.

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_artist_username` | Artist | `username` (UNIQUE) |
| `idx_fan_artist_external` | Fan | `artist_id`, `external_user_id` (UNIQUE, partial) |
