import { useState } from "react";
import {
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from "../services/api";
import { timeAgo } from "../utils/format";

export default function UptimeView({ monitors = [], onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    expectedStatus: 200,
    intervalSec: 30,
    timeoutMs: 5000,
  });

  function openAddModal() {
    setEditingMonitor(null);
    setFormData({
      name: "",
      url: "",
      method: "GET",
      expectedStatus: 200,
      intervalSec: 30,
      timeoutMs: 5000,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(monitor) {
    setEditingMonitor(monitor);
    setFormData({
      name: monitor.name,
      url: monitor.url,
      method: monitor.method || "GET",
      expectedStatus: monitor.expectedStatus || 200,
      intervalSec: monitor.intervalSec || 30,
      timeoutMs: monitor.timeoutMs || 5000,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    try {
      if (editingMonitor) {
        await updateMonitor(editingMonitor.id, formData);
      } else {
        await createMonitor(formData);
      }
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this monitor?")) return;
    try {
      await deleteMonitor(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  }

  return (
    <div className="tab-view">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Uptime & API Monitors</h2>
          <p className="tab-subtitle">
            Continuous health checks with response times and uptime tracking
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Monitor
        </button>
      </div>

      {monitors.length === 0 ? (
        <div className="card empty-card">
          <h3>No monitors configured</h3>
          <p>Create your first HTTP/HTTPS healthcheck monitor to track uptime.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            Add Monitor Now
          </button>
        </div>
      ) : (
        <div className="monitors-grid">
          {monitors.map((m) => (
            <div key={m.id} className="card monitor-card">
              <div className="monitor-top">
                <div className="monitor-identity">
                  <div className="monitor-name-row">
                    <span className="monitor-name">{m.name}</span>
                    <span className={`badge badge-${m.state}`}>
                      {m.state ? m.state.toUpperCase() : "PENDING"}
                    </span>
                  </div>
                  <span className="monitor-url">{m.url}</span>
                </div>
                <div className="monitor-actions">
                  <button
                    className="btn btn-icon"
                    onClick={() => openEditModal(m)}
                    title="Edit monitor"
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => handleDelete(m.id)}
                    title="Delete monitor"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="monitor-metrics">
                <div className="monitor-metric">
                  <span className="metric-label">Uptime</span>
                  <span className="metric-val">
                    {m.uptimePercent !== null ? `${m.uptimePercent}%` : "—"}
                  </span>
                </div>
                <div className="monitor-metric">
                  <span className="metric-label">Last Ping</span>
                  <span className="metric-val">
                    {m.lastResponseTimeMs !== null ? `${m.lastResponseTimeMs} ms` : "—"}
                  </span>
                </div>
                <div className="monitor-metric">
                  <span className="metric-label">Avg Ping</span>
                  <span className="metric-val">
                    {m.avgResponseTimeMs !== null ? `${m.avgResponseTimeMs} ms` : "—"}
                  </span>
                </div>
                <div className="monitor-metric">
                  <span className="metric-label">Checked</span>
                  <span className="metric-val">{timeAgo(m.lastChecked) || "—"}</span>
                </div>
              </div>

              {/* Sparkline from recent checks */}
              <div className="sparkline-container">
                <div className="sparkline-bars">
                  {(m.recentResults || []).map((r, i) => (
                    <div
                      key={i}
                      className={`sparkline-bar ${r.ok ? "sparkline-ok" : "sparkline-down"}`}
                      title={`${new Date(r.ts).toLocaleTimeString()}: ${
                        r.ok ? `${r.responseTimeMs}ms` : r.error || "Down"
                      }`}
                      style={{
                        height: r.ok
                          ? `${Math.min(Math.max((r.responseTimeMs / 500) * 100, 15), 100)}%`
                          : "100%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {m.lastError && <div className="monitor-error">{m.lastError}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">
              {editingMonitor ? "Edit Monitor" : "New Uptime Monitor"}
            </h3>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="monitor-form">
              <div className="form-group">
                <label>Monitor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production API"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>URL (HTTP / HTTPS)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/health"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>HTTP Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected Status</label>
                  <input
                    type="number"
                    min="100"
                    max="599"
                    value={formData.expectedStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedStatus: parseInt(e.target.value, 10) })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Interval (seconds, min 5)</label>
                  <input
                    type="number"
                    min="5"
                    value={formData.intervalSec}
                    onChange={(e) =>
                      setFormData({ ...formData, intervalSec: parseInt(e.target.value, 10) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Timeout (ms)</label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={formData.timeoutMs}
                    onChange={(e) =>
                      setFormData({ ...formData, timeoutMs: parseInt(e.target.value, 10) })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMonitor ? "Save Changes" : "Create Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
