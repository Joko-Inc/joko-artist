import { useRef, useState, useEffect, useCallback } from 'react';
import { authHeaders } from '../auth';
import './Create.css';

type CreateTab = 'create' | 'review';

function IconUpload() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconShirt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1 1.73v3.82a2 2 0 0 0 1 1.73L8 12v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8l4.38-2.26a2 2 0 0 0 1-1.73V5.19a2 2 0 0 0-1-1.73z" />
    </svg>
  );
}

function IconVideoSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

type MediaPreviewKind = 'image' | 'video' | 'audio' | 'file';

function mediaKindFromSource(mime: string, urlOrName: string): MediaPreviewKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const lower = urlOrName.toLowerCase();
  if (/\.(jpe?g|png|gif|webp|svg)$/.test(lower)) return 'image';
  if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower)) return 'audio';
  return 'file';
}

function UploadPreview({
  file,
  existingUrl,
  variant = 'media',
  onRemove,
}: {
  file: File | null;
  existingUrl?: string | null;
  variant?: 'media' | 'thumbnail';
  onRemove: (e: React.MouseEvent) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileName = file?.name ?? existingUrl?.split('/').pop() ?? '';
  const mime = file?.type ?? '';
  const kind = mediaKindFromSource(mime, fileName || existingUrl || '');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(existingUrl ?? null);
  }, [file, existingUrl]);

  if (!fileName && !previewUrl) return null;

  return (
    <div className={`upload-preview upload-preview--${variant}`}>
      <div className="upload-preview-thumb">
        {kind === 'image' && previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : kind === 'video' && previewUrl ? (
          <video src={previewUrl} muted playsInline preload="metadata" />
        ) : kind === 'audio' ? (
          <span className="upload-preview-icon" aria-hidden><IconMusic /></span>
        ) : (
          <span className="upload-preview-icon" aria-hidden><IconDoc /></span>
        )}
      </div>
      <div className="upload-preview-meta">
        <div className="upload-preview-name-row">
          <span className="upload-preview-name">{fileName}</span>
          <button
            type="button"
            className="upload-preview-remove"
            onClick={onRemove}
            aria-label={`Remove ${fileName}`}
          >
            ×
          </button>
        </div>
        <span className="upload-preview-hint">Click to replace</span>
      </div>
    </div>
  );
}

type ContentKind = 'social' | 'video' | 'audio' | 'merch';

type Post = {
  id: string;
  name: string;
  description: string | null;
  file_type: ContentKind;
  file_url: string | null;
  thumbnail_url: string | null;
  category: string | null;
  posted_date: string | null;
  status: 'draft' | 'submitted';
  review_status: 'pending' | 'accepted' | 'declined' | null;
  visible_to_fans: 0 | 1;
  updated_at: string;
  created_at: string;
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function draftProgress(post: Post): number {
  const filled = [post.name, post.description, post.posted_date, post.file_url];
  return Math.round((filled.filter(Boolean).length / filled.length) * 100);
}

const KIND_ICONS: Record<ContentKind, React.FC> = {
  video: IconVideoSmall,
  audio: IconMusic,
  social: IconDoc,
  merch: IconShirt,
};

async function savePost(
  fields: { kind: ContentKind; title: string; description: string; date: string; file: File | null; thumbnail: File | null; status: 'submitted' | 'draft' },
  editingId: string | null,
) {
  const body = new FormData();
  body.append('file_type', fields.kind);
  body.append('name', fields.title);
  body.append('description', fields.description);
  body.append('posted_date', fields.date);
  body.append('status', fields.status);
  if (fields.file) body.append('file', fields.file);
  if (fields.thumbnail) body.append('thumbnail', fields.thumbnail);

  const res = editingId
    ? await fetch(`/api/posts/${editingId}`, { method: 'PUT', headers: authHeaders(), body })
    : await fetch('/api/posts', { method: 'POST', headers: authHeaders(), body });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Post>;
}

function CreateFormView({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
  const [kind, setKind] = useState<ContentKind>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?status=draft', { headers: authHeaders() });
      if (res.ok) setDrafts(await res.json());
    } catch { /* server not running yet */ }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const loadDraft = (post: Post) => {
    setEditingId(post.id);
    setKind(post.file_type);
    setTitle(post.name);
    setDescription(post.description ?? '');
    setDate(post.posted_date ?? '');
    setFile(null);
    setExistingFileUrl(post.file_url);
    setThumbnail(null);
    setExistingThumbnailUrl(post.thumbnail_url);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDraft = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (editingId === id) clearForm();
    fetchDrafts();
  };

  const clearForm = () => {
    setEditingId(null);
    setKind('video');
    setTitle(''); setDescription(''); setDate('');
    setFile(null); setExistingFileUrl(null);
    setThumbnail(null); setExistingThumbnailUrl(null);
    setFeedback(null);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnail(null);
    setExistingThumbnailUrl(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      setExistingFileUrl(null);
    }
    e.target.value = '';
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setThumbnail(picked);
      setExistingThumbnailUrl(null);
    }
    e.target.value = '';
  };

  const handleSubmit = async (status: 'submitted' | 'draft') => {
    if (!title.trim()) { setFeedback('Please enter a title.'); return; }
    setBusy(true);
    setFeedback(null);
    try {
      await savePost({ kind, title, description, date, file, thumbnail, status }, editingId);
      clearForm();
      fetchDrafts();
      if (status === 'submitted') { onSubmitSuccess(); return; }
      setFeedback('Draft saved.');
    } catch {
      setFeedback('Something went wrong. Is the server running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="create-split">
      <div className="create-form-card">
        <h2>{editingId ? 'Edit Draft' : 'Create New'}</h2>
        {feedback && <p style={{ marginBottom: 12, color: feedback.includes('wrong') ? '#e05' : 'inherit' }}>{feedback}</p>}
        <div className="type-grid" role="group" aria-label="Content type">
          {([
            { id: 'social' as const, label: 'Social Post', Icon: IconDoc },
            { id: 'video' as const, label: 'Video', Icon: IconPlay },
            { id: 'audio' as const, label: 'Audio File', Icon: IconMusic },
            { id: 'merch' as const, label: 'Merchandise', Icon: IconShirt },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`type-card type-card--${id} ${kind === id ? 'type-card--active' : ''}`}
              onClick={() => setKind(id)}
            >
              <div className="type-card-icon"><Icon /></div>
              <div className="type-card-label">{label}</div>
            </button>
          ))}
        </div>

        <div className="form-field">
          <label htmlFor="create-title">Title</label>
          <input
            id="create-title"
            name="title"
            placeholder="Enter title.."
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="create-desc">Description</label>
          <textarea
            id="create-desc"
            name="description"
            placeholder="Enter a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Upload Media</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            className="upload-zone"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {file || existingFileUrl ? (
              <UploadPreview
                file={file}
                existingUrl={existingFileUrl}
                variant="media"
                onRemove={clearFile}
              />
            ) : (
              <div>
                <IconUpload />
                <div>
                  Drag &amp; drop files here or click to browse.<br />
                  Support for images, audio, video, and documents.
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="form-field">
          <label>Thumbnail</label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleThumbnailChange}
          />
          <div
            className="upload-zone upload-zone--thumbnail"
            role="button"
            tabIndex={0}
            onClick={() => thumbnailInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && thumbnailInputRef.current?.click()}
          >
            {thumbnail || existingThumbnailUrl ? (
              <UploadPreview
                file={thumbnail}
                existingUrl={existingThumbnailUrl}
                variant="thumbnail"
                onRemove={clearThumbnail}
              />
            ) : (
              <div><IconUpload /><div>Upload thumbnail image</div></div>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="create-date">Date</label>
          <input id="create-date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-submit" disabled={busy} onClick={() => handleSubmit('submitted')}>
            {busy ? 'Submitting…' : 'Submit'}
          </button>
          <button type="button" className="btn-draft" disabled={busy} onClick={() => handleSubmit('draft')}>
            {editingId ? 'Update Draft' : 'Save Draft'}
          </button>
          {editingId && (
            <button type="button" className="btn-draft" disabled={busy} onClick={clearForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <aside className="drafts-column">
        <h3>Drafts</h3>
        {drafts.length === 0 && <p style={{ opacity: 0.5, fontSize: 14 }}>No drafts yet.</p>}
        {drafts.map((post) => {
          const Icon = KIND_ICONS[post.file_type] ?? IconVideoSmall;
          const pct = draftProgress(post);
          return (
            <article key={post.id} className={`draft-card${editingId === post.id ? ' draft-card--active' : ''}`}>
              <span className="draft-badge">Draft</span>
              <div className="draft-card-head">
                <div className="inreview-icon" style={{ width: 36, height: 36 }}>
                  <Icon />
                </div>
                <div>
                  <p className="draft-card-title">{post.name}</p>
                  <p className="draft-card-meta">Last edited {timeAgo(post.updated_at)}</p>
                </div>
              </div>
              <div className="draft-progress-wrap">
                <div className="draft-progress-label">
                  <span>Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="draft-progress-bar">
                  <div className="draft-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="draft-card-actions">
                <button type="button" className="btn-continue" onClick={() => loadDraft(post)}>
                  Continue Editing
                </button>
                <button type="button" className="btn-delete-draft" onClick={() => deleteDraft(post.id)} aria-label="Delete draft">
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </aside>
    </div>
  );
}

const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

const KIND_LABEL: Record<ContentKind, string> = {
  video: 'Video',
  audio: 'Audio File',
  social: 'Social Post',
  merch: 'Merchandise',
};

function InReviewView({ showToast, onDismissToast }: { showToast: boolean; onDismissToast: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?status=submitted', { headers: authHeaders() });
      if (res.ok) setPosts(await res.json());
    } catch { /* server not running */ }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const deletePost = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchPosts();
  };

  const formatDate = (iso: string) =>
    new Date(iso + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="inreview-wrap">
      {showToast && (
        <div className="inreview-toast" role="status">
          <div>
            <p>
              SUCCESSFULLY SUBMITTED!
              <small>Your work will be reviewed soon.</small>
            </p>
          </div>
          <button type="button" className="inreview-toast-close" onClick={onDismissToast} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}

      <div className="inreview-list" style={{ marginTop: showToast ? 56 : 8 }}>
        {posts.length === 0 && <p style={{ opacity: 0.5, fontSize: 14 }}>No posts submitted for review yet.</p>}
        {posts.map((post) => {
          const Icon = KIND_ICONS[post.file_type] ?? IconVideoSmall;
          const rs = post.review_status ?? 'pending';
          return (
            <article key={post.id} className="inreview-card">
              <div className="inreview-card-top">
                <div
                  className="inreview-icon"
                  style={post.thumbnail_url ? { backgroundImage: `url(${post.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  {!post.thumbnail_url && <Icon />}
                </div>
                <div className="inreview-card-text">
                  <h3>{post.name}</h3>
                  <p>{KIND_LABEL[post.file_type]}</p>
                </div>
                <span className={`status-badge-review status-badge-review--${rs}`}>
                  {REVIEW_STATUS_LABEL[rs]}
                </span>
              </div>

              <div className="inreview-timeline-section">
                <p className="inreview-timeline-title">Review Timeline</p>
                <div className="timeline">
                  <div className="timeline-step">
                    <div className="timeline-dot">✓</div>
                    <div className="timeline-step-body">
                      <strong>Submitted</strong>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <div className={`timeline-step ${rs !== 'pending' ? 'timeline-step--done' : ''}`}>
                    <div className={`timeline-dot ${rs === 'pending' ? 'timeline-dot--pending' : ''}`}>
                      {rs !== 'pending' ? '✓' : ''}
                    </div>
                    <div className="timeline-step-body">
                      <strong>Review</strong>
                      {rs === 'pending'
                        ? <span className="pending-label">Pending</span>
                        : <span>{REVIEW_STATUS_LABEL[rs]}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" className="btn-delete-post" onClick={() => deletePost(post.id)} aria-label="Delete post">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function Create() {
  const [tab, setTab] = useState<CreateTab>('create');
  const [showToast, setShowToast] = useState(false);

  const handleSubmitSuccess = () => {
    setShowToast(true);
    setTab('review');
  };

  return (
    <div className="create-page">
      <header className="create-header">
        <h1 className="create-title">Create</h1>
        <div className="create-segment" role="tablist" aria-label="Create workspace">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'create'}
            className={tab === 'create' ? 'create-segment--active' : ''}
            onClick={() => setTab('create')}
          >
            Create
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'review'}
            className={tab === 'review' ? 'create-segment--active' : ''}
            onClick={() => setTab('review')}
          >
            In Review
          </button>
        </div>
      </header>

      {tab === 'create' && <CreateFormView onSubmitSuccess={handleSubmitSuccess} />}
      {tab === 'review' && (
        <InReviewView showToast={showToast} onDismissToast={() => setShowToast(false)} />
      )}
    </div>
  );
}
