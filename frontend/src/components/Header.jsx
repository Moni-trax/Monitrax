import ConnectionStatus from "./ConnectionStatus";
import { timeAgo } from "../utils/format";

export default function Header({ hostname, status, lastUpdated, openAnomalies = 0 }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="logo-pulse" />
        <h1 className="logo-title">MONITRAX</h1>
        <span className="hostname-pill">{hostname || "unknown-host"}</span>
      </div>
      <div className="status-container">
        {openAnomalies > 0 && (
          <span className="badge badge-down header-anomaly-badge">
            ⚠ {openAnomalies} {openAnomalies === 1 ? "Anomaly" : "Anomalies"}
          </span>
        )}
        {lastUpdated && status === "disconnected" && (
          <span className="last-updated-label">
            Last updated {timeAgo(lastUpdated)}
          </span>
        )}
        <ConnectionStatus status={status} />
      </div>
    </header>
  );
}

