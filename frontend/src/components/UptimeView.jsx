import { useState, useMemo } from "react";
import {
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from "../services/api";
import { timeAgo } from "../utils/format";

export default function UptimeView({ monitors = [], onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    expectedStatus: "200",
    intervalSec: "30",
    timeoutSec: "5",
  });

  const errors = useMemo(() => {
    const errs = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = "Name is required";
    }

    const trimmedUrl = formData.url.trim();
    if (!trimmedUrl) {
      errs.url = "URL is required";
    } else if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      errs.url = "URL must start with http:// or https://";
    }

    const statusNum = Number(formData.expectedStatus);
    if (!formData.expectedStatus || isNaN(statusNum) || !Number.isInteger(statusNum) || statusNum < 100 || statusNum > 599) {
      errs.expectedStatus = "Status must be between 100 and 599";
    }

    const intervalNum = Number(formData.intervalSec);
    if (!formData.intervalSec || isNaN(intervalNum) || intervalNum < 5 || intervalNum > 3600) {
      errs.intervalSec = "Interval must be between 5 and 3600 seconds";
    }

    const timeoutNum = Number(formData.timeoutSec);
    if (!formData.timeoutSec || isNaN(timeoutNum) || timeoutNum < 1 || timeoutNum > 60) {
      errs.timeoutSec = "Timeout must be between 1 and 60 seconds";
    } else if (!isNaN(intervalNum) && timeoutNum > intervalNum) {
      errs.timeoutSec = "Timeout cannot exceed the check interval";
    }

    return errs;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  function openAddModal() {
    setEditingMonitor(null);
    setFormData({
      name: "",
      url: "",
      method: "GET",
      expectedStatus: "200",
      intervalSec: "30",
      timeoutSec: "5",
    });
    setSubmitError("");
    setIsSubmitting(false);
    setIsModalOpen(true);
  }

  function openEditModal(monitor) {
    setEditingMonitor(monitor);
    setFormData({
      name: monitor.name || "",
      url: monitor.url || "",
      method: monitor.method || "GET",
      expectedStatus: String(monitor.expectedStatus ?? 200),
      intervalSec: String(monitor.intervalSec ?? 30),
      timeoutSec: String(Math.round((monitor.timeoutMs ?? 5000) / 1000)),
    });
    setSubmitError("");
    setIsSubmitting(false);
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      method: formData.method,
      expectedStatus: parseInt(formData.expectedStatus, 10),
      intervalSec: parseInt(formData.intervalSec, 10),
      timeoutMs: parseInt(formData.timeoutSec, 10) * 1000,
    };

    try {
      if (editingMonitor) {
        await updateMonitor(editingMonitor.id, payload);
      } else {
        await createMonitor(payload);
      }
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
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

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">
              {editingMonitor ? "Edit Monitor" : "New Uptime Monitor"}
            </h3>
            {submitError && <div className="form-error">{submitError}</div>}
            <form onSubmit={handleSubmit} className="monitor-form" noValidate>
              <div className="form-group">
                <label htmlFor="monitor-name">Monitor Name</label>
                <input
                  id="monitor-name"
                  type="text"
                  placeholder="e.g. Production API"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="monitor-url">URL (HTTP / HTTPS)</label>
                <input
                  id="monitor-url"
                  type="url"
                  placeholder="https://example.com/health"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
                {errors.url && <span className="field-error">{errors.url}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monitor-method">HTTP Method</label>
                  <select
                    id="monitor-method"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="monitor-status">Expected Status</label>
                  <input
                    id="monitor-status"
                    type="number"
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    placeholder="200"
                    value={formData.expectedStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedStatus: e.target.value })
                    }
                  />
                  <span className="field-help">Range: 100 - 599</span>
                  {errors.expectedStatus && (
                    <span className="field-error">{errors.expectedStatus}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monitor-interval">Check Interval (seconds)</label>
                  <input
                    id="monitor-interval"
                    type="number"
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    placeholder="30"
                    value={formData.intervalSec}
                    onChange={(e) =>
                      setFormData({ ...formData, intervalSec: e.target.value })
                    }
                  />
                  <span className="field-help">Range: 5 - 3600 s</span>
                  {errors.intervalSec && (
                    <span className="field-error">{errors.intervalSec}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="monitor-timeout">Timeout (seconds)</label>
                  <input
                    id="monitor-timeout"
                    type="number"
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    placeholder="5"
                    value={formData.timeoutSec}
                    onChange={(e) =>
                      setFormData({ ...formData, timeoutSec: e.target.value })
                    }
                  />
                  <span className="field-help">Range: 1 - 60 s (≤ interval)</span>
                  {errors.timeoutSec && (
                    <span className="field-error">{errors.timeoutSec}</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingMonitor
                    ? "Save Changes"
                    : "Create Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
