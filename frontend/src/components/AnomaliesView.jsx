import { useState } from "react";
import { timeAgo } from "../utils/format";

export default function AnomaliesView({ anomalies }) {
  const [filter, setFilter] = useState("all");

  const summary = anomalies.summary || { open: 0, critical: 0, warning: 0, total: 0 };
  const list = anomalies.recent || [];

  const filtered = list.filter((a) => {
    if (filter === "open") return a.status === "open";
    if (filter === "resolved") return a.status === "resolved";
    return true;
  });

  return (
    <div className="tab-view">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Anomaly Detection</h2>
          <p className="tab-subtitle">
            Rolling-window z-score analysis and sustained threshold breach monitoring
          </p>
        </div>
        <div className="filter-pill-group">
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({summary.total || list.length})
          </button>
          <button
            className={`filter-pill ${filter === "open" ? "active" : ""}`}
            onClick={() => setFilter("open")}
          >
            Open ({summary.open || 0})
          </button>
          <button
            className={`filter-pill ${filter === "resolved" ? "active" : ""}`}
            onClick={() => setFilter("resolved")}
          >
            Resolved ({Math.max(0, (summary.total || list.length) - (summary.open || 0))})
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card level-critical">
          <span className="stat-label">Critical Open</span>
          <div className="stat-value text-critical">{summary.critical || 0}</div>
          <span className="stat-subtext">|z| ≥ 5 or hard limit breached</span>
        </div>
        <div className="stat-card level-warning">
          <span className="stat-label">Warning Open</span>
          <div className="stat-value text-warning">{summary.warning || 0}</div>
          <span className="stat-subtext">|z| ≥ 3 sustained across points</span>
        </div>
        <div className="stat-card level-normal">
          <span className="stat-label">Total Recorded</span>
          <div className="stat-value">{summary.total || list.length}</div>
          <span className="stat-subtext">Recent anomaly events</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-icon">🛡️</div>
          <h3>No {filter !== "all" ? filter : ""} anomalies detected</h3>
          <p>
            All monitored series are behaving within normal rolling baseline thresholds.
          </p>
        </div>
      ) : (
        <div className="anomalies-list">
          {filtered.map((a) => {
            const isOpen = a.status === "open";
            const isCritical = a.severity === "critical";

            return (
              <div
                key={a.id}
                className={`card anomaly-card ${
                  isOpen ? (isCritical ? "border-critical" : "border-warning") : ""
                }`}
              >
                <div className="anomaly-top">
                  <div className="anomaly-header-left">
                    <span
                      className={`badge ${
                        isCritical ? "badge-down" : "badge-pending"
                      }`}
                    >
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="anomaly-series">{a.series}</span>
                    <span className="badge badge-subtle">{a.kind}</span>
                  </div>
                  <span
                    className={`badge ${
                      isOpen ? "status-disconnected" : "status-live"
                    }`}
                  >
                    {isOpen ? "● OPEN" : "✓ RESOLVED"}
                  </span>
                </div>

                <p className="anomaly-msg">{a.message}</p>

                <div className="anomaly-footer">
                  <div className="anomaly-stats">
                    <span>Value: <strong>{a.value}</strong></span>
                    <span>Mean: <strong>{a.baselineMean}</strong></span>
                    <span>Std: <strong>{a.baselineStd}</strong></span>
                    <span>z: <strong>{a.zScore}</strong></span>
                  </div>
                  <div className="anomaly-timing">
                    <span>Started {timeAgo(a.startedAt)}</span>
                    {a.resolvedAt && (
                      <span> · Resolved {timeAgo(a.resolvedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
