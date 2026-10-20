import { getStatusLevel } from "../utils/format";

export default function CoreGrid({ perCore = [] }) {
  return (
    <div className="card core-card">
      <div className="card-header">
        <h3 className="card-title">Per-Core Activity</h3>
        <span className="card-badge">{perCore.length} Cores</span>
      </div>
      <div className="core-grid">
        {perCore.map((load, index) => {
          const level = getStatusLevel(load);
          return (
            <div key={index} className="core-item">
              <div className="core-info">
                <span className="core-label">Core {index}</span>
                <span className={`core-val text-${level}`}>{load.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill bg-${level}`}
                  style={{ width: `${Math.min(load, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
