import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchRecentLogs } from "../services/api";
import { timeAgo } from "../utils/format";

export default function LogsView({ logsSummary }) {
  const [levelFilter, setLevelFilter] = useState("");
  const [search, setSearch] = useState("");
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadLogs() {
      setLoadingLogs(true);
      try {
        const data = await fetchRecentLogs({ level: levelFilter, limit: 100 });
        if (active) setRecentEntries(data);
      } catch {
        // Fallback
      } finally {
        if (active) setLoadingLogs(false);
      }
    }

    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [levelFilter]);

  const filteredEntries = recentEntries.filter((l) => {
    if (!search) return true;
    return (
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.source.toLowerCase().includes(search.toLowerCase())
    );
  });

  const chartData = (logsSummary.perMinute || []).map((pm) => ({
    time: pm.minute,
    ERROR: pm.ERROR || 0,
    WARN: pm.WARN || 0,
    INFO: pm.INFO || 0,
    DEBUG: pm.DEBUG || 0,
  }));

  return (
    <div className="tab-view">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Log Analysis</h2>
          <p className="tab-subtitle">
            Real-time log stream ingestion, per-minute levels, and error pattern clustering
          </p>
        </div>
        <span className="badge badge-subtle">
          {logsSummary.totalLogs || recentEntries.length} Ingested Logs
        </span>
      </div>

      {/* Chart: Per-minute volume stacked by level */}
      <div className="card chart-card">
        <div className="card-header">
          <h3 className="card-title">Log Volume (Last 60 Minutes)</h3>
          <div className="legend-pills">
            <span className="legend-dot dot-error" /> Error
            <span className="legend-dot dot-warn" /> Warn
            <span className="legend-dot dot-info" /> Info
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#262c36" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="#525d6f" fontSize={10} tickLine={false} minTickGap={30} />
              <YAxis stroke="#525d6f" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  color: "#e6edf3",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="ERROR" stackId="a" fill="#f87171" isAnimationActive={false} />
              <Bar dataKey="WARN" stackId="a" fill="#fbbf24" isAnimationActive={false} />
              <Bar dataKey="INFO" stackId="a" fill="#38bdf8" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Error Patterns Table */}
      {logsSummary.topPatterns && logsSummary.topPatterns.length > 0 && (
        <div className="card table-card">
          <div className="card-header" style={{ padding: "16px 20px 0" }}>
            <h3 className="card-title">Top Error Patterns</h3>
            <span className="card-badge">{logsSummary.topPatterns.length} Patterns</span>
          </div>
          <div className="table-responsive">
            <table className="docker-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Occurrences</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th>Sample Message</th>
                </tr>
              </thead>
              <tbody>
                {logsSummary.topPatterns.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="pattern-cell">
                        {p.isNew && <span className="badge badge-down">NEW</span>}
                        <code className="pattern-text">{p.pattern}</code>
                      </div>
                    </td>
                    <td>
                      <span className="metric-val text-critical">{p.count}</span>
                    </td>
                    <td>
                      <span className="cell-sub">{timeAgo(p.firstSeen)}</span>
                    </td>
                    <td>
                      <span className="cell-sub">{timeAgo(p.lastSeen)}</span>
                    </td>
                    <td>
                      <span className="container-image" title={p.sample}>
                        {p.sample}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Feed Controls */}
      <div className="log-controls">
        <div className="log-filters">
          <button
            className={`filter-pill ${levelFilter === "" ? "active" : ""}`}
            onClick={() => setLevelFilter("")}
          >
            All
          </button>
          <button
            className={`filter-pill ${levelFilter === "ERROR" ? "active" : ""}`}
            onClick={() => setLevelFilter("ERROR")}
          >
            Error
          </button>
          <button
            className={`filter-pill ${levelFilter === "WARN" ? "active" : ""}`}
            onClick={() => setLevelFilter("WARN")}
          >
            Warn
          </button>
          <button
            className={`filter-pill ${levelFilter === "INFO" ? "active" : ""}`}
            onClick={() => setLevelFilter("INFO")}
          >
            Info
          </button>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search logs or sources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Recent Entries Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="docker-table logs-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Time</th>
                <th style={{ width: "80px" }}>Level</th>
                <th style={{ width: "120px" }}>Source</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    {loadingLogs ? "Loading log stream..." : "No log entries found matching criteria"}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="cell-sub">
                        {new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          l.level === "ERROR"
                            ? "badge-down"
                            : l.level === "WARN"
                            ? "badge-pending"
                            : "badge-up"
                        }`}
                      >
                        {l.level}
                      </span>
                    </td>
                    <td>
                      <span className="container-id">{l.source}</span>
                    </td>
                    <td>
                      <span className="log-message-text">{l.message}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
