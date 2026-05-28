import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const artist = db.prepare('SELECT * FROM Artist WHERE username = ?').get(username);
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
// GET /api/wallet — return artist wallet info + proxied Circle balance
app.get('/api/wallet', requireAuth, async (req, res) => {
  const artist = db.prepare('SELECT wallet_address, circle_wallet_id, wallet_chain FROM Artist WHERE id = ?').get(req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  let balance = null;
  if (artist.circle_wallet_id) {
    try {
      const r = await fetch(`${PAYMENTS_URL}/joko/wallet/balance/${artist.circle_wallet_id}`);
      if (r.ok) balance = await r.json();
    } catch {}
  }

  res.json({
    walletAddress: artist.wallet_address ?? null,
    circleWalletId: artist.circle_wallet_id ?? null,
    walletChain: artist.wallet_chain ?? null,
    balance,
  });
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

// POST /api/posts — create or save-draft a post
app.post('/api/posts', uploadFields, (req, res) => {
  const { name, description, category, posted_date, file_type, artist_id, status } = req.body;

  if (!name || !file_type) {
    return res.status(400).json({ error: 'name and file_type are required' });
  }

  const file_url = req.files?.['file']?.[0] ? `/uploads/${req.files['file'][0].filename}` : null;
  const thumbnail_url = req.files?.['thumbnail']?.[0] ? `/uploads/${req.files['thumbnail'][0].filename}` : null;

  const stmt = db.prepare(`
    INSERT INTO Post (artist_id, name, description, file_type, file_url, thumbnail_url, category, posted_date, status, review_status)
    VALUES (@artist_id, @name, @description, @file_type, @file_url, @thumbnail_url, @category, @posted_date, @status, @review_status)
  `);

  const resolvedStatus = status ?? 'draft';
  const result = stmt.run({
    artist_id: artist_id ?? null,
    name,
    description: description ?? null,
    file_type,
    file_url,
    thumbnail_url,
    category: category ?? null,
    posted_date: posted_date ?? null,
    status: resolvedStatus,
    review_status: resolvedStatus === 'submitted' ? 'pending' : null,
  });

  const post = db.prepare('SELECT * FROM Post WHERE rowid = ?').get(result.lastInsertRowid);
  res.status(201).json(post);
});

// GET /api/posts?status=draft — list posts, optionally filtered by status
app.get('/api/posts', (req, res) => {
  const { status } = req.query;
  const posts = status
    ? db.prepare('SELECT * FROM Post WHERE status = ? ORDER BY updated_at DESC').all(status)
    : db.prepare('SELECT * FROM Post ORDER BY updated_at DESC').all();
  res.json(posts);
});

// DELETE /api/posts/:id — delete a post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM Post WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  db.prepare('DELETE FROM Post WHERE id = ?').run(id);
  res.status(204).end();
});

// PUT /api/posts/:id — update an existing post
app.put('/api/posts/:id', uploadFields, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM Post WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  const { name, description, category, posted_date, file_type, status } = req.body;
  const file_url = req.files?.['file']?.[0] ? `/uploads/${req.files['file'][0].filename}` : existing.file_url;
  const thumbnail_url = req.files?.['thumbnail']?.[0] ? `/uploads/${req.files['thumbnail'][0].filename}` : existing.thumbnail_url;

  const resolvedStatus = status ?? existing.status;
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
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    name: name ?? existing.name,
    description: description ?? existing.description,
    file_type: file_type ?? existing.file_type,
    file_url,
    thumbnail_url,
    category: category ?? existing.category,
    posted_date: posted_date ?? existing.posted_date,
    status: resolvedStatus,
    review_status: resolvedStatus === 'submitted' ? (existing.review_status ?? 'pending') : existing.review_status,
  });

  res.json(db.prepare('SELECT * FROM Post WHERE id = ?').get(id));
});

// PATCH /api/posts/:id — update review_status and/or visible_to_fans
app.patch('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM Post WHERE id = ?').get(id);
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
