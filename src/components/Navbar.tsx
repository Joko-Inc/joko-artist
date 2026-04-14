import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

/**
 * Side Navigation Bar for the Artist Interface.
 */
export function Navbar() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path ? 'active-link' : '';

    return (
        <nav className="side-nav">
            <div className="nav-profile">
                <p className="artist-name">Irawo Afolunde</p>
            </div>
            <div className="nav-menu">
                <ul>
                    <li className={isActive('/dashboard')}><Link to="/dashboard">Dashboard</Link></li>
                    <li className={isActive('/create')}><Link to="/create">Create</Link></li>
                    <li className={isActive('/analytics')}><Link to="/analytics">Analytics</Link></li>
                    <li className={isActive('/monetization')}><Link to="/monetization">Monetization</Link></li>
                </ul>
            </div>
            <div className="nav-footer">
                <h2 className="joko-logo">JOKO</h2>
            </div>
        </nav>
    );
}