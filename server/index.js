import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } from './email.js';
import { provisionArtistWallet, saveArtistWallet } from './wallet.js';
import {
  parseCircleUsdcBalance,
  normalizeCircleTransaction,
  buildBalanceChart,
} from './circleWallet.js';

// Use an env var in production: JWT_SECRET=<random-secret> node server/index.js
const JWT_SECRET = process.env.JWT_SECRET ?? 'joko-dev-secret-change-in-production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Render, mount a persistent disk at /data and set DATA_DIR=/data
// Locally this falls back to the database/ folder in the project root
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '../database');
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(__dirname, '../public/uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS Artist (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name            TEXT NOT NULL,
    profile_pic_url TEXT,
    avg_sub_amount  REAL NOT NULL DEFAULT 0.0,
    engagement      REAL NOT NULL DEFAULT 0.0,
    total_views     INTEGER NOT NULL DEFAULT 0,
    monthly_revenue REAL NOT NULL DEFAULT 0.0,
    username        TEXT,
    password_hash   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_username ON Artist(username);

  CREATE TABLE IF NOT EXISTS Post (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    artist_id     TEXT,
    name          TEXT NOT NULL,
    description   TEXT,
    thumbnail_url TEXT,
    file_type     TEXT NOT NULL,
    file_url      TEXT,
    category      TEXT,
    posted_date   TEXT,
    status        TEXT NOT NULL DEFAULT 'draft',
    review_status TEXT,
    visible_to_fans INTEGER DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES Artist(id)
  );

  CREATE TABLE IF NOT EXISTS Fan (
    id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    artist_id        TEXT NOT NULL,
    external_user_id TEXT,
    display_name     TEXT,
    email            TEXT,
    city             TEXT,
    region           TEXT,
    country          TEXT,
    monthly_amount   REAL NOT NULL DEFAULT 0.0,
    subscribed_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES Artist(id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_fan_artist_external
    ON Fan(artist_id, external_user_id)
    WHERE external_user_id IS NOT NULL;
`);

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Add wallet columns if they don't exist yet (idempotent migrations)
for (const col of ['wallet_address', 'circle_wallet_id', 'wallet_chain']) {
  try { db.exec(`ALTER TABLE Artist ADD COLUMN ${col} TEXT`); } catch {}
}

// Onboarding profile columns (idempotent)
for (const col of [
  'email', 'location', 'phone', 'artist_statement', 'website',
  'instagram', 'twitter', 'music_links', 'other_links', 'email_verified',
  'verification_token', 'aesthetic_urls', 'slug',
  'first_name', 'last_name', 'artist_name',
  'password_reset_token', 'password_reset_expires',
]) {
  try { db.exec(`ALTER TABLE Artist ADD COLUMN ${col} TEXT`); } catch {}
}

try { db.exec('ALTER TABLE Post ADD COLUMN merch_price REAL'); } catch {}
try { db.exec('ALTER TABLE Post ADD COLUMN merch_quantity INTEGER'); } catch {}

// Backfill name fields from legacy full name
for (const row of db.prepare(`
  SELECT id, name FROM Artist
  WHERE (first_name IS NULL OR first_name = '') AND name IS NOT NULL
`).all()) {
  const parts = row.name.trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  db.prepare(`
    UPDATE Artist SET
      first_name = ?,
      last_name = ?,
      artist_name = COALESCE(NULLIF(artist_name, ''), name)
    WHERE id = ?
  `).run(firstName, lastName, row.id);
}

function resolveArtist(artistIdOrSlug) {
  if (!artistIdOrSlug) return null;
  const key = String(artistIdOrSlug).trim();
  return db.prepare(`
    SELECT * FROM Artist
    WHERE id = ? OR slug = ? OR username = ?
  `).get(key, key.toLowerCase(), key);
}

function syncArtistFanStats(artistId) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS fan_count,
      COALESCE(SUM(monthly_amount), 0) AS revenue
    FROM Fan WHERE artist_id = ?
  `).get(artistId);

  const active30 = db.prepare(`
    SELECT COUNT(*) AS c FROM Fan
    WHERE artist_id = ? AND subscribed_at >= datetime('now', '-30 days')
  `).get(artistId).c;

  const fanCount = stats.fan_count || 0;
  const engagement = fanCount > 0
    ? Math.min(100, Math.round((active30 / fanCount) * 100))
    : 0;
  const avgSubAmount = fanCount > 0 ? stats.revenue / fanCount : 0;

  db.prepare(`
    UPDATE Artist SET
      monthly_revenue = ?,
      engagement = ?,
      avg_sub_amount = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(stats.revenue, engagement, avgSubAmount, artistId);
}

// Backfill slug from username for existing artists
for (const row of db.prepare("SELECT id, username FROM Artist WHERE slug IS NULL OR slug = ''").all()) {
  if (row.username) {
    db.prepare('UPDATE Artist SET slug = ? WHERE id = ?').run(row.username.toLowerCase(), row.id);
  }
}

function aestheticUrlsFromFiles(files) {
  if (!files?.length) return null;
  return JSON.stringify(files.map((f) => `/uploads/${f.filename}`));
}

function parseAestheticUrls(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const PAYMENTS_URL = process.env.PAYMENTS_URL ?? 'http://localhost:5001';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Seed test artist on startup if not already present
const existing = db.prepare("SELECT id FROM Artist WHERE username = 'testuser'").get();
if (!existing) {
  const hash = bcrypt.hashSync('testpassword', 10);
  db.prepare(`
    INSERT INTO Artist (name, username, password_hash)
    VALUES ('Irawo Ayotunde', 'testuser', ?)
  `).run(hash);
  console.log('Seeded test artist: testuser');
}

// POST /api/auth/login — accepts username or email
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const artist = db.prepare(
    'SELECT * FROM Artist WHERE username = ? OR email = ?',
  ).get(username, username);
  if (!artist || !artist.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, artist.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: artist.id, username: artist.username, name: artist.name },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
  res.json({ token });
});

// POST /api/auth/forgot-password — send reset link (verified emails only)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const artist = db.prepare(
    'SELECT * FROM Artist WHERE email IS NOT NULL AND LOWER(email) = LOWER(?)',
  ).get(email);

  if (!artist) {
    return res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
  }

  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE Artist SET password_reset_token = ?, password_reset_expires = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(token, expires, artist.id);

  const emailResult = await sendPasswordResetEmail({ to: artist.email, name: artist.name, token });

  res.json({
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
    emailSent: emailResult.sent,
    ...(emailResult.resetUrl && { resetUrl: emailResult.resetUrl }),
  });
});

// POST /api/auth/reset-password — set new password via token from email
app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const artist = db.prepare('SELECT * FROM Artist WHERE password_reset_token = ?').get(token);
  if (!artist) {
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }

  if (artist.password_reset_expires && new Date(artist.password_reset_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(`
    UPDATE Artist SET
      password_hash = ?,
      password_reset_token = NULL,
      password_reset_expires = NULL,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(passwordHash, artist.id);

  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

async function sendArtistVerificationEmail(artist) {
  const token = generateVerificationToken();
  db.prepare(`
    UPDATE Artist SET verification_token = ?, updated_at = datetime('now') WHERE id = ?
  `).run(token, artist.id);

  return sendVerificationEmail({ to: artist.email, name: artist.name, token });
}

async function ensureArtistWallet(artist) {
  if (artist.circle_wallet_id) {
    return { created: false, reason: 'already_exists', circleWalletId: artist.circle_wallet_id };
  }

  const result = await provisionArtistWallet();
  if (result.created) {
    saveArtistWallet(db, artist.id, result);
  }
  return result;
}

const onboardUpload = upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'aesthetic', maxCount: 10 },
]);

// POST /api/auth/onboard — create artist account with profile + password
app.post('/api/auth/onboard', onboardUpload, async (req, res) => {
  const {
    firstName, lastName, email, location, phone,
    artistStatement, website, instagram, twitter, musicLinks, otherLinks,
    username, password,
  } = req.body;

  if (!email || !firstName || !username || !password) {
    return res.status(400).json({ error: 'First name, email, username, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3–32 characters (letters, numbers, underscores)' });
  }

  const emailTaken = db.prepare(
    'SELECT id FROM Artist WHERE email IS NOT NULL AND LOWER(email) = LOWER(?)',
  ).get(email);
  if (emailTaken) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const usernameTaken = db.prepare(
    'SELECT id FROM Artist WHERE username IS NOT NULL AND LOWER(username) = LOWER(?)',
  ).get(username);
  if (usernameTaken) {
    return res.status(409).json({ error: 'Username is already taken.' });
  }

  const profilePicUrl = req.files?.profilePic?.[0]
    ? `/uploads/${req.files.profilePic[0].filename}`
    : null;
  const newAestheticUrls = aestheticUrlsFromFiles(req.files?.aesthetic);

  const name = [firstName, lastName].filter(Boolean).join(' ');
  const passwordHash = bcrypt.hashSync(password, 10);
  const slug = username.toLowerCase();

  const result = db.prepare(`
    INSERT INTO Artist (
      name, first_name, last_name, artist_name,
      username, slug, email, password_hash, profile_pic_url,
      location, phone, artist_statement,
      website, instagram, twitter, music_links, other_links,
      aesthetic_urls, email_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0')
  `).run(
    name, firstName, lastName, name, username, slug, email, passwordHash, profilePicUrl,
    location ?? null, phone ?? null, artistStatement ?? null,
    website ?? null, instagram ?? null, twitter ?? null,
    musicLinks ?? null, otherLinks ?? null,
    newAestheticUrls,
  );

  const artist = db.prepare('SELECT * FROM Artist WHERE rowid = ?').get(result.lastInsertRowid);
  const emailResult = await sendArtistVerificationEmail(artist);

  res.status(201).json({
    success: true,
    artistId: artist.id,
    emailSent: emailResult.sent,
    ...(emailResult.verifyUrl && { verifyUrl: emailResult.verifyUrl }),
  });
});

// POST /api/auth/provision-wallet — create Circle wallet during onboarding (no login yet)
app.post('/api/auth/provision-wallet', async (req, res) => {
  const { artistId, email } = req.body;
  if (!artistId || !email) {
    return res.status(400).json({ error: 'artistId and email are required' });
  }

  const artist = db.prepare(`
    SELECT * FROM Artist WHERE id = ? AND email IS NOT NULL AND LOWER(email) = LOWER(?)
  `).get(artistId, email);

  if (!artist) {
    return res.status(404).json({ error: 'Artist not found' });
  }

  if (artist.circle_wallet_id) {
    return res.json({
      success: true,
      walletCreated: false,
      circleWalletId: artist.circle_wallet_id,
    });
  }

  const walletResult = await ensureArtistWallet(artist);
  if (!walletResult.created) {
    return res.status(502).json({
      error: 'Could not create wallet. Check payments service configuration.',
      reason: walletResult.reason,
      detail: walletResult.error,
    });
  }

  res.json({
    success: true,
    walletCreated: true,
    circleWalletId: walletResult.circleWalletId,
  });
});

// POST /api/auth/resend-verification
app.post('/api/auth/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const artist = db.prepare('SELECT * FROM Artist WHERE email = ?').get(email);
  if (!artist) return res.status(404).json({ error: 'No account found for this email' });
  if (artist.email_verified === '1') {
    return res.status(400).json({ error: 'Email is already verified' });
  }

  const emailResult = await sendArtistVerificationEmail(artist);
  res.json({
    success: true,
    emailSent: emailResult.sent,
    ...(emailResult.verifyUrl && { verifyUrl: emailResult.verifyUrl }),
  });
});

// GET /api/auth/verify-email — mark email verified via token from verification email
app.get('/api/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token required' });

  const artist = db.prepare('SELECT * FROM Artist WHERE verification_token = ?').get(token);
  if (!artist) return res.status(400).json({ error: 'Invalid or expired verification link' });

  db.prepare(`
    UPDATE Artist SET email_verified = '1', verification_token = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).run(artist.id);

  res.redirect('/onboarding?verified=1');
});

function splitFullName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function artistProfileResponse(artist) {
  const fromName = splitFullName(artist.name);
  const firstName = artist.first_name || fromName.firstName;
  const lastName = artist.last_name || fromName.lastName;
  const artistName = artist.artist_name || artist.name || '';
  const displayName = artistName || artist.name || '';
  return {
    id: artist.id,
    name: artist.name,
    firstName,
    lastName,
    artistName,
    displayName,
    username: artist.username,
    email: artist.email,
    profilePicUrl: artist.profile_pic_url,
    location: artist.location,
    phone: artist.phone,
    artistStatement: artist.artist_statement,
    website: artist.website,
    instagram: artist.instagram,
    twitter: artist.twitter,
    musicLinks: artist.music_links,
    otherLinks: artist.other_links,
    aestheticUrls: parseAestheticUrls(artist.aesthetic_urls),
    emailVerified: artist.email_verified === '1',
    createdAt: artist.created_at,
    updatedAt: artist.updated_at,
  };
}

// GET /api/artist/me — return logged-in artist's saved profile
app.get('/api/artist/me', requireAuth, (req, res) => {
  const artist = db.prepare('SELECT * FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  res.json(artistProfileResponse(artist));
});

const profileUpload = upload.single('profilePic');

// PATCH /api/artist/me — update non-critical profile settings
app.patch('/api/artist/me', requireAuth, profileUpload, (req, res) => {
  const artist = db.prepare('SELECT * FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const {
    firstName, lastName, artistName, location, phone,
    artistStatement, website, instagram, twitter, musicLinks, otherLinks,
  } = req.body;

  const profilePicUrl = req.file
    ? `/uploads/${req.file.filename}`
    : artist.profile_pic_url;

  const resolvedFirst = firstName !== undefined ? firstName : (artist.first_name ?? '');
  const resolvedLast = lastName !== undefined ? lastName : (artist.last_name ?? '');
  const resolvedArtistName = artistName !== undefined ? artistName : (artist.artist_name ?? artist.name);
  const fullName = [resolvedFirst, resolvedLast].filter(Boolean).join(' ') || resolvedArtistName;

  db.prepare(`
    UPDATE Artist SET
      first_name = ?,
      last_name = ?,
      artist_name = ?,
      name = ?,
      profile_pic_url = ?,
      location = ?,
      phone = ?,
      artist_statement = ?,
      website = ?,
      instagram = ?,
      twitter = ?,
      music_links = ?,
      other_links = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    resolvedFirst || null,
    resolvedLast || null,
    resolvedArtistName || null,
    fullName,
    profilePicUrl,
    location !== undefined ? (location || null) : artist.location,
    phone !== undefined ? (phone || null) : artist.phone,
    artistStatement !== undefined ? (artistStatement || null) : artist.artist_statement,
    website !== undefined ? (website || null) : artist.website,
    instagram !== undefined ? (instagram || null) : artist.instagram,
    twitter !== undefined ? (twitter || null) : artist.twitter,
    musicLinks !== undefined ? (musicLinks || null) : artist.music_links,
    otherLinks !== undefined ? (otherLinks || null) : artist.other_links,
    req.user.id,
  );

  const updated = db.prepare('SELECT * FROM Artist WHERE id = ?').get(req.user.id);
  res.json(artistProfileResponse(updated));
});

// POST /api/fans/subscribe — record a fan subscription (called from fan app after payment)
app.post('/api/fans/subscribe', (req, res) => {
  const {
    artistId, artistSlug, externalUserId, displayName, email,
    city, region, country, monthlyAmount,
  } = req.body;

  const artist = resolveArtist(artistId ?? artistSlug);
  if (!artist) {
    return res.status(404).json({ error: 'Artist not found' });
  }

  const amount = Number(monthlyAmount) || 0;

  if (externalUserId) {
    const existing = db.prepare(
      'SELECT id FROM Fan WHERE artist_id = ? AND external_user_id = ?',
    ).get(artist.id, externalUserId);

    if (existing) {
      db.prepare(`
        UPDATE Fan SET
          display_name = COALESCE(?, display_name),
          email = COALESCE(?, email),
          city = COALESCE(?, city),
          region = COALESCE(?, region),
          country = COALESCE(?, country),
          monthly_amount = ?
        WHERE id = ?
      `).run(
        displayName ?? null, email ?? null,
        city ?? null, region ?? null, country ?? null,
        amount, existing.id,
      );
      syncArtistFanStats(artist.id);
      return res.json({ success: true, fanId: existing.id, updated: true });
    }
  }

  const result = db.prepare(`
    INSERT INTO Fan (
      artist_id, external_user_id, display_name, email,
      city, region, country, monthly_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    artist.id, externalUserId ?? null, displayName ?? null, email ?? null,
    city ?? null, region ?? null, country ?? null, amount,
  );

  syncArtistFanStats(artist.id);

  const fan = db.prepare('SELECT * FROM Fan WHERE rowid = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, fanId: fan.id });
});

// POST /api/dev/seed-fans — insert realistic test fan data for the logged-in artist (dev/demo only)
app.post('/api/dev/seed-fans', requireAuth, (req, res) => {
  const artistId = req.user.id;
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  };
  const TEST_FANS = [
    { display_name: 'dearshrimp',     email: 'fan1@test.com', city: 'New York', region: 'NY',          country: 'USA',       monthly_amount: 8.99,  subscribed_at: daysAgo(155) },
    { display_name: 'waveform_k',     email: 'fan2@test.com', city: 'London',   region: 'England',      country: 'UK',        monthly_amount: 12.50, subscribed_at: daysAgo(120) },
    { display_name: 'nolimitsaudio',  email: 'fan3@test.com', city: 'Lagos',    region: 'Lagos State',  country: 'Nigeria',   monthly_amount: 5.00,  subscribed_at: daysAgo(90) },
    { display_name: 'midnightvibes',  email: 'fan4@test.com', city: 'Toronto',  region: 'ON',           country: 'Canada',    monthly_amount: 9.99,  subscribed_at: daysAgo(60) },
    { display_name: 'fanclub_jade',   email: 'fan5@test.com', city: 'Tokyo',    region: 'Kanto',        country: 'Japan',     monthly_amount: 15.00, subscribed_at: daysAgo(35) },
    { display_name: 'supportlocal',   email: 'fan6@test.com', city: 'Berlin',   region: 'Berlin',       country: 'Germany',   monthly_amount: 6.00,  subscribed_at: daysAgo(12) },
    { display_name: 'playlist_addict',email: 'fan7@test.com', city: 'Sydney',   region: 'NSW',          country: 'Australia', monthly_amount: 10.00, subscribed_at: daysAgo(2)  },
  ];
  const insert = db.prepare(`
    INSERT OR IGNORE INTO Fan (artist_id, external_user_id, display_name, email, city, region, country, monthly_amount, subscribed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((fans) => {
    for (const f of fans) {
      insert.run(artistId, `seed-${f.email}`, f.display_name, f.email, f.city, f.region, f.country, f.monthly_amount, f.subscribed_at);
    }
  });
  insertMany(TEST_FANS);
  syncArtistFanStats(artistId);
  res.json({ success: true, message: `Seeded ${TEST_FANS.length} test fans.` });
});

// DELETE /api/dev/seed-fans — remove all seeded test fans for the logged-in artist
app.delete('/api/dev/seed-fans', requireAuth, (req, res) => {
  const artistId = req.user.id;
  const result = db.prepare(
    "DELETE FROM Fan WHERE artist_id = ? AND external_user_id LIKE 'seed-%'"
  ).run(artistId);
  syncArtistFanStats(artistId);
  res.json({ success: true, message: `Removed ${result.changes} test fans.` });
});

// GET /api/artist/insights — fan analytics for logged-in artist
app.get('/api/artist/insights', requireAuth, (req, res) => {
  const artistId = req.user.id;

  const totalFans = db.prepare(
    'SELECT COUNT(*) AS c FROM Fan WHERE artist_id = ?',
  ).get(artistId).c;

  const newFansThisWeek = db.prepare(`
    SELECT COUNT(*) AS c FROM Fan
    WHERE artist_id = ? AND subscribed_at >= datetime('now', '-7 days')
  `).get(artistId).c;

  const newFansThisMonth = db.prepare(`
    SELECT COUNT(*) AS c FROM Fan
    WHERE artist_id = ? AND subscribed_at >= datetime('now', '-30 days')
  `).get(artistId).c;

  const newFansPrevMonth = db.prepare(`
    SELECT COUNT(*) AS c FROM Fan
    WHERE artist_id = ?
      AND subscribed_at >= datetime('now', '-60 days')
      AND subscribed_at < datetime('now', '-30 days')
  `).get(artistId).c;

  const topRegion = db.prepare(`
    SELECT country AS label, COUNT(*) AS c FROM Fan
    WHERE artist_id = ? AND country IS NOT NULL AND trim(country) != ''
    GROUP BY country ORDER BY c DESC LIMIT 1
  `).get(artistId);

  const topCity = db.prepare(`
    SELECT city AS label, COUNT(*) AS c FROM Fan
    WHERE artist_id = ? AND city IS NOT NULL AND trim(city) != ''
    GROUP BY city ORDER BY c DESC LIMIT 1
  `).get(artistId);

  const revenueRow = db.prepare(`
    SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM Fan WHERE artist_id = ?
  `).get(artistId);

  const artistFull = db.prepare('SELECT engagement, total_views, avg_sub_amount FROM Artist WHERE id = ?').get(artistId);

  const fanGrowthByMonth = db.prepare(`
    SELECT strftime('%Y-%m', subscribed_at) AS month, COUNT(*) AS count
    FROM Fan WHERE artist_id = ?
    GROUP BY month ORDER BY month ASC LIMIT 6
  `).all(artistId);

  res.json({
    totalFans,
    newFansThisWeek,
    newFansThisMonth,
    newFansPrevMonth,
    topRegion: topRegion?.label ?? null,
    topCity: topCity?.label ?? null,
    monthlyRevenue: revenueRow.total,
    engagement: artistFull?.engagement ?? 0,
    totalViews: artistFull?.total_views ?? 0,
    avgSubAmount: artistFull?.avg_sub_amount ?? 0,
    fanGrowthByMonth,
  });
});

// GET /api/artist/revenue — detailed revenue analytics for logged-in artist
app.get('/api/artist/revenue', requireAuth, (req, res) => {
  const artistId = req.user.id;

  const totalRevenue = db.prepare(
    'SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM Fan WHERE artist_id = ?'
  ).get(artistId).total;

  const avgSubAmount = db.prepare(
    'SELECT COALESCE(AVG(monthly_amount), 0) AS avg FROM Fan WHERE artist_id = ?'
  ).get(artistId).avg;

  const newRevenue = db.prepare(`
    SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM Fan
    WHERE artist_id = ? AND subscribed_at >= datetime('now', '-30 days')
  `).get(artistId).total;

  const returningRevenue = db.prepare(`
    SELECT COALESCE(SUM(monthly_amount), 0) AS total FROM Fan
    WHERE artist_id = ? AND subscribed_at < datetime('now', '-30 days')
  `).get(artistId).total;

  const topCities = db.prepare(`
    SELECT
      COALESCE(city, country, 'Unknown') AS label,
      country,
      COUNT(*) AS fan_count,
      SUM(monthly_amount) AS revenue
    FROM Fan WHERE artist_id = ?
    GROUP BY COALESCE(city, country, 'Unknown'), country
    ORDER BY revenue DESC LIMIT 7
  `).all(artistId);

  const topFans = db.prepare(`
    SELECT display_name, country, monthly_amount
    FROM Fan WHERE artist_id = ?
    ORDER BY monthly_amount DESC LIMIT 7
  `).all(artistId);

  const revenueByPrice = db.prepare(`
    SELECT ROUND(monthly_amount, 2) AS price, SUM(monthly_amount) AS revenue
    FROM Fan WHERE artist_id = ?
    GROUP BY ROUND(monthly_amount, 2)
    ORDER BY price ASC
  `).all(artistId);

  res.json({ totalRevenue, avgSubAmount, newRevenue, returningRevenue, topCities, topFans, revenueByPrice });
});

// POST /api/wallet/provision — create Circle wallet for artists who don't have one yet
app.post('/api/wallet/provision', requireAuth, async (req, res) => {
  const artist = db.prepare('SELECT id, circle_wallet_id FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  if (artist.circle_wallet_id) {
    return res.json({ success: true, walletCreated: false, circleWalletId: artist.circle_wallet_id });
  }

  const walletResult = await ensureArtistWallet(artist);
  if (!walletResult.created) {
    return res.status(502).json({
      error: 'Could not create wallet. Check payments service configuration.',
      reason: walletResult.reason,
      detail: walletResult.error,
    });
  }

  res.json({
    success: true,
    walletCreated: true,
    circleWalletId: walletResult.circleWalletId,
  });
});

// GET /api/wallet — return artist wallet info + proxied Circle balance
app.get('/api/wallet', requireAuth, async (req, res) => {
  const artist = db.prepare('SELECT wallet_address, circle_wallet_id, wallet_chain FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const usdcTokenId = process.env.USDC_TOKEN_ID ?? '';
  let balance = null;
  let balanceChart = null;
  let balanceError = null;

  if (artist.circle_wallet_id) {
    try {
      const r = await fetch(`${PAYMENTS_URL}/joko/wallet/balance/${artist.circle_wallet_id}`);
      if (r.ok) {
        const raw = await r.json();
        balance = parseCircleUsdcBalance(raw, usdcTokenId);
        if (!balance) balanceError = 'Could not read USDC balance from Circle response.';
      } else {
        balanceError = 'Payments service returned an error loading balance.';
      }
    } catch {
      balanceError = 'Could not reach payments service. Is it running on port 5001?';
    }

    try {
      const txRes = await fetch(`${PAYMENTS_URL}/joko/wallet/transactions/${artist.circle_wallet_id}`);
      if (txRes.ok) {
        const { transactions: rawTxs = [] } = await txRes.json();
        const currentUsdc = balance?.amount != null ? Number(balance.amount) : 0;
        balanceChart = buildBalanceChart(rawTxs, currentUsdc, usdcTokenId);
      }
    } catch {}
  }

  res.json({
    walletAddress: artist.wallet_address ?? null,
    circleWalletId: artist.circle_wallet_id ?? null,
    walletChain: artist.wallet_chain ?? null,
    balance,
    balanceChart,
    balanceError,
  });
});

// GET /api/wallet/transactions — Circle transaction history for the artist wallet
app.get('/api/wallet/transactions', requireAuth, async (req, res) => {
  const artist = db.prepare('SELECT circle_wallet_id FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  if (!artist.circle_wallet_id) {
    return res.json({ transactions: [] });
  }

  const usdcTokenId = process.env.USDC_TOKEN_ID ?? '';

  try {
    const r = await fetch(`${PAYMENTS_URL}/joko/wallet/transactions/${artist.circle_wallet_id}`);
    if (!r.ok) return res.status(r.status).json({ error: 'Failed to load transactions' });

    const { transactions: rawTxs = [] } = await r.json();
    const transactions = rawTxs
      .map((tx) => normalizeCircleTransaction(tx, usdcTokenId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ transactions });
  } catch (err) {
    console.error('Wallet transactions error:', err);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

// POST /api/wallet/connect — save artist's external wallet address and/or Circle wallet ID
app.post('/api/wallet/connect', requireAuth, (req, res) => {
  const { walletAddress, circleWalletId, walletChain } = req.body;
  if (!walletAddress && !circleWalletId && !walletChain) {
    return res.status(400).json({ error: 'walletAddress, circleWalletId, or walletChain required' });
  }

  const sets = [];
  const params = [];
  if (walletAddress) { sets.push('wallet_address = ?'); params.push(walletAddress); }
  if (circleWalletId) { sets.push('circle_wallet_id = ?'); params.push(circleWalletId); }
  if (walletChain) { sets.push('wallet_chain = ?'); params.push(walletChain); }
  params.push(req.user.id);

  db.prepare(`UPDATE Artist SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// POST /api/wallet/withdraw — transfer USDC from Circle platform wallet to artist's external address
app.post('/api/wallet/withdraw', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const artist = db.prepare('SELECT wallet_address, circle_wallet_id FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist?.circle_wallet_id) {
    return res.status(400).json({ error: 'No Circle wallet linked to your account. Contact support.' });
  }
  if (!artist?.wallet_address) {
    return res.status(400).json({ error: 'No withdrawal address connected. Add one in Manage Wallet first.' });
  }

  try {
    const r = await fetch(`${PAYMENTS_URL}/joko/wallet/charge-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payerWalletId: artist.circle_wallet_id,
        recipientWalletAddress: artist.wallet_address,
        tokenId: process.env.USDC_TOKEN_ID ?? '',
        amount: String(amount),
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json({ success: true, transaction: data });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Transfer failed. Please try again.' });
  }
});

const uploadFields = upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isFutureOrTodayDate(dateStr) {
  if (!dateStr) return true;
  return dateStr >= todayDateString();
}

function validatePostFileType(fileType, fileUrl, mimetype, originalname) {
  if (!fileUrl) return null;
  const name = (originalname ?? fileUrl).toLowerCase();
  const mime = (mimetype ?? '').toLowerCase();

  if (fileType === 'video') {
    const ok = mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/.test(name);
    return ok ? null : 'Video posts require an MP4, WebM, or MOV file.';
  }
  if (fileType === 'audio') {
    const ok = mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(name);
    return ok ? null : 'Audio posts require an MP3, WAV, OGG, M4A, AAC, or FLAC file.';
  }
  if (fileType === 'merch') {
    const ok = mime.startsWith('image/') || /\.(jpe?g|png|webp)$/.test(name);
    return ok ? null : 'Merchandise posts require a JPG, PNG, or WebP product image.';
  }
  return null;
}

function validatePostPayload({ file_type, status, posted_date, file_url, merch_price, merch_quantity, mimetype, originalname }) {
  const resolvedStatus = status ?? 'draft';

  if (resolvedStatus === 'submitted') {
    if (posted_date && !isFutureOrTodayDate(posted_date)) {
      return 'Scheduled date must be today or in the future.';
    }
    if (['video', 'audio', 'merch'].includes(file_type) && !file_url) {
      const labels = { video: 'video file', audio: 'audio file', merch: 'product image' };
      return `A ${labels[file_type]} is required to submit this post.`;
    }
    if (file_type === 'merch') {
      const price = Number(merch_price);
      if (!merch_price || isNaN(price) || price <= 0) {
        return 'A valid merch price is required to submit.';
      }
      const qty = Number(merch_quantity);
      if (!merch_quantity || isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
        return 'A valid merch quantity is required to submit (whole number, at least 1).';
      }
    }
  }

  const fileErr = validatePostFileType(file_type, file_url, mimetype, originalname);
  if (fileErr) return fileErr;

  return null;
}

function getOwnedPost(artistId, postId) {
  return db.prepare('SELECT * FROM Post WHERE id = ? AND artist_id = ?').get(postId, artistId);
}

// POST /api/posts — create or save-draft a post (scoped to logged-in artist)
app.post('/api/posts', requireAuth, uploadFields, (req, res) => {
  const { name, description, category, posted_date, file_type, status, merch_price, merch_quantity } = req.body;

  if (!name || !file_type) {
    return res.status(400).json({ error: 'name and file_type are required' });
  }

  const file = req.files?.['file']?.[0] ?? null;
  const file_url = file ? `/uploads/${file.filename}` : null;
  const thumbnail_url = req.files?.['thumbnail']?.[0] ? `/uploads/${req.files['thumbnail'][0].filename}` : null;

  const resolvedStatus = status ?? 'draft';
  const parsedMerchPrice = merch_price != null && merch_price !== '' ? Number(merch_price) : null;
  const parsedMerchQuantity = merch_quantity != null && merch_quantity !== '' ? Number(merch_quantity) : null;

  const validationError = validatePostPayload({
    file_type,
    status: resolvedStatus,
    posted_date,
    file_url,
    merch_price: parsedMerchPrice,
    merch_quantity: parsedMerchQuantity,
    mimetype: file?.mimetype,
    originalname: file?.originalname,
  });
  if (validationError) return res.status(400).json({ error: validationError });

  const stmt = db.prepare(`
    INSERT INTO Post (artist_id, name, description, file_type, file_url, thumbnail_url, category, posted_date, status, review_status, merch_price, merch_quantity)
    VALUES (@artist_id, @name, @description, @file_type, @file_url, @thumbnail_url, @category, @posted_date, @status, @review_status, @merch_price, @merch_quantity)
  `);

  const result = stmt.run({
    artist_id: req.user.id,
    name,
    description: description ?? null,
    file_type,
    file_url,
    thumbnail_url,
    category: category ?? null,
    posted_date: posted_date ?? null,
    status: resolvedStatus,
    review_status: resolvedStatus === 'submitted' ? 'pending' : null,
    merch_price: file_type === 'merch' ? parsedMerchPrice : null,
    merch_quantity: file_type === 'merch' ? parsedMerchQuantity : null,
  });

  const post = db.prepare('SELECT * FROM Post WHERE rowid = ?').get(result.lastInsertRowid);
  res.status(201).json(post);
});

// GET /api/posts?status=draft — list posts for logged-in artist only
app.get('/api/posts', requireAuth, (req, res) => {
  const { status } = req.query;
  const artistId = req.user.id;
  const posts = status
    ? db.prepare('SELECT * FROM Post WHERE artist_id = ? AND status = ? ORDER BY updated_at DESC').all(artistId, status)
    : db.prepare('SELECT * FROM Post WHERE artist_id = ? ORDER BY updated_at DESC').all(artistId);
  res.json(posts);
});

// DELETE /api/posts/:id — delete a post owned by logged-in artist
app.delete('/api/posts/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const existing = getOwnedPost(req.user.id, id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  db.prepare('DELETE FROM Post WHERE id = ?').run(id);
  res.status(204).end();
});

// PUT /api/posts/:id — update an existing post owned by logged-in artist
app.put('/api/posts/:id', requireAuth, uploadFields, (req, res) => {
  const { id } = req.params;
  const existing = getOwnedPost(req.user.id, id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  const { name, description, category, posted_date, file_type, status, merch_price, merch_quantity } = req.body;
  const file = req.files?.['file']?.[0] ?? null;
  const file_url = file ? `/uploads/${file.filename}` : existing.file_url;
  const thumbnail_url = req.files?.['thumbnail']?.[0] ? `/uploads/${req.files['thumbnail'][0].filename}` : existing.thumbnail_url;

  const resolvedStatus = status ?? existing.status;
  const resolvedFileType = file_type ?? existing.file_type;
  const parsedMerchPrice = merch_price != null && merch_price !== ''
    ? Number(merch_price)
    : existing.merch_price;
  const parsedMerchQuantity = merch_quantity != null && merch_quantity !== ''
    ? Number(merch_quantity)
    : existing.merch_quantity;

  const validationError = validatePostPayload({
    file_type: resolvedFileType,
    status: resolvedStatus,
    posted_date: posted_date ?? existing.posted_date,
    file_url,
    merch_price: parsedMerchPrice,
    merch_quantity: parsedMerchQuantity,
    mimetype: file?.mimetype,
    originalname: file?.originalname ?? file_url,
  });
  if (validationError) return res.status(400).json({ error: validationError });

  db.prepare(`
    UPDATE Post SET
      name = @name,
      description = @description,
      file_type = @file_type,
      file_url = @file_url,
      thumbnail_url = @thumbnail_url,
      category = @category,
      posted_date = @posted_date,
      status = @status,
      review_status = @review_status,
      merch_price = @merch_price,
      merch_quantity = @merch_quantity,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    name: name ?? existing.name,
    description: description ?? existing.description,
    file_type: resolvedFileType,
    file_url,
    thumbnail_url,
    category: category ?? existing.category,
    posted_date: posted_date ?? existing.posted_date,
    status: resolvedStatus,
    review_status: resolvedStatus === 'submitted' ? (existing.review_status ?? 'pending') : existing.review_status,
    merch_price: resolvedFileType === 'merch' ? parsedMerchPrice : null,
    merch_quantity: resolvedFileType === 'merch' ? parsedMerchQuantity : null,
  });

  res.json(db.prepare('SELECT * FROM Post WHERE id = ?').get(id));
});

// PATCH /api/posts/:id — update review_status and/or visible_to_fans (owned by logged-in artist)
app.patch('/api/posts/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const existing = getOwnedPost(req.user.id, id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  const { review_status, visible_to_fans } = req.body;
  db.prepare(`
    UPDATE Post SET
      review_status = @review_status,
      visible_to_fans = @visible_to_fans,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    review_status: review_status ?? existing.review_status,
    visible_to_fans: visible_to_fans !== undefined ? (visible_to_fans ? 1 : 0) : existing.visible_to_fans,
  });

  res.json(db.prepare('SELECT * FROM Post WHERE id = ?').get(id));
});

// Serve the built React app in production
const distDir = path.join(__dirname, '../dist');
app.use(express.static(distDir));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
