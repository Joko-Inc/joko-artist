import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { authHeaders, getUser } from '../auth';
import { ProfileSettingsModal, type ArtistProfile } from './ProfileSettingsModal';
import './Navbar.css';

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconCreate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconScheduled() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

function IconMonetization() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export const Navbar = ({ onLogout }: { onLogout: () => void }) => {
  const user = getUser();
  const fallbackName = user?.name ?? 'Artist';
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadProfile = useCallback(() => {
    fetch('/api/artist/me', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setProfile(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const displayName = profile?.displayName || profile?.artistName || fallbackName;
  const profilePicUrl = profile?.profilePicUrl ?? null;

  const handleProfileSaved = (updated: ArtistProfile) => {
    setProfile(updated);
  };

  return (
    <>
      <nav className="sidebar">
        <button
          type="button"
          className="sidebar-profile sidebar-profile--clickable"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open profile settings"
        >
          <div className="profile-icon">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="profile-icon-img" />
            ) : (
              <span className="initials">{initials(displayName)}</span>
            )}
          </div>
          <div className="profile-info">
            <span className="artist-name">{displayName.toUpperCase()}</span>
            <span className="artist-label">Artist</span>
          </div>
        </button>

        <div className="divider" />

        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="icon"><IconDashboard /></span>
              DASHBOARD
            </NavLink>
          </li>
          <li>
            <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="icon"><IconCreate /></span>
              CREATE
            </NavLink>
          </li>
          <li>
            <NavLink to="/scheduled" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="icon"><IconScheduled /></span>
              SCHEDULED
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="icon"><IconAnalytics /></span>
              ANALYTICS
            </NavLink>
          </li>
          <li>
            <NavLink to="/monetization" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="icon"><IconMonetization /></span>
              MONETIZATION
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer">
          <img src="/jokologo.png" alt="Joko" className="brand-logo" />
          <button type="button" className="logout-btn" onClick={onLogout} aria-label="Sign out">
            <IconLogout />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <ProfileSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleProfileSaved}
        initialProfile={profile}
      />
    </>
  );
};
