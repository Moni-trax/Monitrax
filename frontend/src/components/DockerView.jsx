import { formatBytes, formatPercent, getStatusLevel } from "../utils/format";

export default function DockerView({ docker }) {
  if (!docker || docker.available === false) {
    return (
      <div className="tab-view">
        <div className="tab-header">
          <div>
            <h2 className="tab-title">Docker Containers</h2>
            <p className="tab-subtitle">Real-time resource utilization and container states</p>
          </div>
        </div>
        <div className="card empty-card">
          <div className="docker-inactive-icon">🐳</div>
          <h3>Docker is not available</h3>
          <p>
            The Docker daemon is not installed or not running on this host system.
            Start Docker Desktop or the systemd service to see active containers.
          </p>
        </div>
      </div>
    );
  }

  const containers = docker.containers || [];

  return (
    <div className="tab-view">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Docker Containers</h2>
          <p className="tab-subtitle">
            {containers.length} active or monitored container{containers.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="badge badge-up">Docker Daemon Connected</span>
      </div>

      {containers.length === 0 ? (
        <div className="card empty-card">
          <h3>No containers found</h3>
          <p>There are no Docker containers found on this host.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="docker-table">
              <thead>
                <tr>
                  <th>Container</th>
                  <th>Image</th>
                  <th>State</th>
                  <th>CPU %</th>
                  <th>Memory</th>
                  <th>Network I/O</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c) => {
                  const cpuLevel = getStatusLevel(c.cpuPercent || 0);
                  const memLevel = getStatusLevel(c.memPercent || 0);
                  const isRunning = c.state === "running";

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="container-name-cell">
                          <span className="container-name">{c.name}</span>
                          <span className="container-id">{c.id.slice(0, 12)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="container-image" title={c.image}>
                          {c.image}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isRunning ? "badge-up" : "badge-down"
                          }`}
                        >
                          {c.status || c.state}
                        </span>
                      </td>
                      <td>
                        <div className="cell-bar-container">
                          <span className={`cell-val text-${cpuLevel}`}>
                            {formatPercent(c.cpuPercent || 0)}
                          </span>
                          <div className="progress-track sm-track">
                            <div
                              className={`progress-fill bg-${cpuLevel}`}
                              style={{ width: `${Math.min(c.cpuPercent || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-bar-container">
                          <span className={`cell-val text-${memLevel}`}>
                            {formatPercent(c.memPercent || 0)}
                          </span>
                          <span className="cell-sub">
                            {formatBytes(c.memUsageBytes)} / {formatBytes(c.memLimitBytes)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="network-stats">
                          ↓ {formatBytes(c.netRxBytes || 0)} / ↑ {formatBytes(c.netTxBytes || 0)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
