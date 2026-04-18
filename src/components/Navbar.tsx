import { NavLink } from 'react-router-dom';
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

export const Navbar = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-profile">
        <div className="profile-icon">
          <span className="initials">IA</span>
        </div>
        <div className="profile-info">
          <span className="artist-name">IRAWO AYOTUNDE</span>
          <span className="artist-label">Artist</span>
        </div>
      </div>

      <div className="divider" />

      <ul className="nav-links">
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span className="icon">
              <IconDashboard />
            </span>
            DASHBOARD
          </NavLink>
        </li>
        <li>
          <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="icon">
              <IconCreate />
            </span>
            CREATE
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/analytics"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span className="icon">
              <IconAnalytics />
            </span>
            ANALYTICS
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/monetization"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span className="icon">
              <IconMonetization />
            </span>
            MONETIZATION
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <h2 className="brand-logo">JOKO</h2>
      </div>
    </nav>
  );
};
