const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      errorDetail = errJson.details?.join(", ") || errJson.error || res.statusText;
    } catch {
      // Keep statusText
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export function fetchMetricsHistory() {
  return request("/api/metrics/history");
}

export function fetchMonitors() {
  return request("/api/monitors");
}

export function createMonitor(data) {
  return request("/api/monitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMonitor(id, data) {
  return request(`/api/monitors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMonitor(id) {
  return request(`/api/monitors/${id}`, {
    method: "DELETE",
  });
}

export function fetchDockerSnapshot() {
  return request("/api/docker");
}
