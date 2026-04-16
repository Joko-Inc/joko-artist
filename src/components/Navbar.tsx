import { NavLink } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
    return (
        <nav className="sidebar">
            {/* Top: Artist Profile */}
            <div className="sidebar-profile">
                <div className="profile-icon">
                    <span className="initials">IA</span>
                </div>
                <div className="profile-info">
                    <span className="artist-name">IRAWO AYOTUNDE</span>
                    <span className="artist-label">Artist</span>
                </div>
            </div>

            <div className="divider"></div>

            {/* Middle: Nav Links (This section will expand) */}
            <ul className="nav-links">
                <li>
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="icon">⊞</span> DASHBOARD
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/create" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="icon">⊕</span> CREATE
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="icon">📈</span> ANALYTICS
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/monetization" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="icon">💰</span> MONETIZATION
                    </NavLink>
                </li>
            </ul>

            {/* Bottom: Brand Logo */}
            <div className="sidebar-footer">
                <h2 className="brand-logo">JOKO</h2>
            </div>
        </nav>
    );
};