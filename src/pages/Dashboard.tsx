import { StatCard } from "../components/StatCard";

/**
 * Dashboard Page Component.
 */
const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
                <button className="artist-view-btn">Artist View</button>
            </header>

            <div className="stats-grid">
                <StatCard label="Total Fans" value="4.8K" trend="+5% last month" />
                <StatCard label="Engagement" value="84%" trend="+2% last month" />
                <StatCard label="Monthly Revenue" value="$14,345" trend="+$1,200 last month" />
            </div>

            <section className="content-section">
                <h3>Recent Content</h3>
                <div className="content-list-placeholder">
                    <p style={{ color: 'white' }}>Recent uploads will appear here.</p>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;