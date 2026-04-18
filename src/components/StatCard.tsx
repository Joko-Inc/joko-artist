import type { ReactNode } from "react";
import "./StatCard.css";

type StatTone = "blue" | "green" | "purple" | "teal" | "yellow";

export function StatCard({
  label,
  value,
  trend,
  icon,
  tone = "blue",
  trendVariant = "positive",
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  tone?: StatTone;
  trendVariant?: "positive" | "negative";
}) {
  const trendClass =
    trendVariant === "negative" ? "stat-trend stat-trend--negative" : "stat-trend";

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <p className="stat-label">{label}</p>
        <div className={`stat-card-icon stat-card-icon--${tone}`} aria-hidden>
          {icon}
        </div>
      </div>
      <h2 className="stat-value">{value}</h2>
      <div className={trendClass}>{trend}</div>
    </div>
  );
}
