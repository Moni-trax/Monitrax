export default function StatCard({ label, value, subtext, level = "normal" }) {
  return (
    <div className={`stat-card level-${level}`}>
      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>
      {subtext && <span className="stat-subtext">{subtext}</span>}
    </div>
  );
}
