/**
 * StatCard component for displaying dashboard metrics.
 */
export function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
    return (
        <div className="stat-card">
            <p className="stat-label">{label}</p>
            <h2 className="stat-value">{value}</h2>
            <div className="counter">{trend}</div>
        </div>
    );
}