import { useEffect, useRef, useState } from 'react';
import { authHeaders } from '../auth';
import './ProfileSettingsModal.css';

export type ArtistProfile = {
  firstName: string;
  lastName: string;
  artistName: string;
  displayName: string;
  username?: string;
  email?: string | null;
  profilePicUrl: string | null;
  location: string | null;
  phone: string | null;
  artistStatement: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  musicLinks: string | null;
  otherLinks: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (profile: ArtistProfile) => void;
  initialProfile?: ArtistProfile | null;
};

function applyProfileToForm(
  data: ArtistProfile,
  setters: {
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setArtistName: (v: string) => void;
    setLocation: (v: string) => void;
    setPhone: (v: string) => void;
    setArtistStatement: (v: string) => void;
    setWebsite: (v: string) => void;
    setInstagram: (v: string) => void;
    setTwitter: (v: string) => void;
    setMusicLinks: (v: string) => void;
    setOtherLinks: (v: string) => void;
    setProfilePicPreview: (v: string | null) => void;
  },
) {
  setters.setFirstName(data.firstName ?? '');
  setters.setLastName(data.lastName ?? '');
  setters.setArtistName(data.artistName ?? '');
  setters.setLocation(data.location ?? '');
  setters.setPhone(data.phone ?? '');
  setters.setArtistStatement(data.artistStatement ?? '');
  setters.setWebsite(data.website ?? '');
  setters.setInstagram(data.instagram ?? '');
  setters.setTwitter(data.twitter ?? '');
  setters.setMusicLinks(data.musicLinks ?? '');
  setters.setOtherLinks(data.otherLinks ?? '');
  setters.setProfilePicPreview(data.profilePicUrl ?? null);
}

export function ProfileSettingsModal({ open, onClose, onSaved, initialProfile }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [artistStatement, setArtistStatement] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [musicLinks, setMusicLinks] = useState('');
  const [otherLinks, setOtherLinks] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setters = {
    setFirstName,
    setLastName,
    setArtistName,
    setLocation,
    setPhone,
    setArtistStatement,
    setWebsite,
    setInstagram,
    setTwitter,
    setMusicLinks,
    setOtherLinks,
    setProfilePicPreview,
  };

  useEffect(() => {
    if (!open) return;

    setError(null);
    setProfilePic(null);

    if (initialProfile) {
      applyProfileToForm(initialProfile, setters);
      setUsername(initialProfile.username ?? '');
      setEmail(initialProfile.email ?? '');
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetch('/api/artist/me', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ArtistProfile) => {
        applyProfileToForm(data, setters);
        setUsername(data.username ?? '');
        setEmail(data.email ?? '');
      })
      .catch(() => {
        if (!initialProfile) setError('Could not load profile.');
      })
      .finally(() => setLoading(false));
  }, [open, initialProfile]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('firstName', firstName.trim());
      body.append('lastName', lastName.trim());
      body.append('artistName', artistName.trim());
      body.append('location', location.trim());
      body.append('phone', phone.trim());
      body.append('artistStatement', artistStatement.trim());
      body.append('website', website.trim());
      body.append('instagram', instagram.trim());
      body.append('twitter', twitter.trim());
      body.append('musicLinks', musicLinks.trim());
      body.append('otherLinks', otherLinks.trim());
      if (profilePic) body.append('profilePic', profilePic);

      const res = await fetch('/api/artist/me', {
        method: 'PATCH',
        headers: authHeaders(),
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save changes.');
        return;
      }
      onSaved(data);
      onClose();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="profile-settings-overlay" onClick={onClose} role="presentation">
      <div
        className="profile-settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
      >
        <div className="profile-settings-header">
          <h2 id="profile-settings-title">Profile Settings</h2>
          <button type="button" className="profile-settings-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading ? (
          <p className="profile-settings-loading">Loading…</p>
        ) : (
          <>
            <div className="profile-settings-avatar-row">
              <button
                type="button"
                className="profile-settings-avatar"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
              >
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="" />
                ) : (
                  <span>+</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="profile-settings-file-input"
                onChange={handlePicChange}
              />
              <p className="profile-settings-avatar-hint">Click to change photo</p>
            </div>

            {(username || email) && (
              <div className="profile-settings-readonly">
                {username && (
                  <div>
                    <span className="profile-settings-readonly-label">Username</span>
                    <span className="profile-settings-readonly-value">{username}</span>
                  </div>
                )}
                {email && (
                  <div>
                    <span className="profile-settings-readonly-label">Email</span>
                    <span className="profile-settings-readonly-value">{email}</span>
                  </div>
                )}
              </div>
            )}

            <div className="profile-settings-fields">
              <label>
                First name
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </label>
              <label>
                Artist name
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Stage / display name"
                />
              </label>
              <label>
                Location
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, country"
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </label>
              <label>
                Bio
                <textarea
                  value={artistStatement}
                  onChange={(e) => setArtistStatement(e.target.value)}
                  placeholder="Artist statement"
                  rows={3}
                />
              </label>
              <label>
                Website
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label>
                Instagram
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@handle"
                />
              </label>
              <label>
                Twitter
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@handle"
                />
              </label>
              <label>
                Music link(s)
                <input
                  type="text"
                  value={musicLinks}
                  onChange={(e) => setMusicLinks(e.target.value)}
                  placeholder="Spotify, SoundCloud, etc."
                />
              </label>
              <label>
                Other link(s)
                <input
                  type="text"
                  value={otherLinks}
                  onChange={(e) => setOtherLinks(e.target.value)}
                  placeholder="Other links"
                />
              </label>
            </div>

            {error && <p className="profile-settings-error">{error}</p>}

            <div className="profile-settings-actions">
              <button type="button" className="profile-settings-btn profile-settings-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-settings-btn profile-settings-btn--primary"
                disabled={busy}
                onClick={handleSave}
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
