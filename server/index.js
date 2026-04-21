import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../database/database.sqlite'));
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
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

const PORT = 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
