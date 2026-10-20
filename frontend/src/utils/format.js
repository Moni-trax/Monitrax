export function bytesToGb(bytes) {
  if (typeof bytes !== "number" || isNaN(bytes)) return "0.00 GB";
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function formatBytes(bytes) {
  if (typeof bytes !== "number" || isNaN(bytes) || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i] || "B"}`;
}

export function formatPercent(val) {
  if (typeof val !== "number" || isNaN(val)) return "0.0%";
  return `${val.toFixed(1)}%`;
}

export function getStatusLevel(percent) {
  if (percent >= 85) return "critical";
  if (percent >= 60) return "warning";
  return "normal";
}

export function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 2) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export function normalizeSnapshot(raw) {
  if (!raw) return null;
  const ts = typeof raw.timestamp === "number" ? raw.timestamp : new Date(raw.timestamp).getTime();
  return {
    timestamp: ts,
    hostname: raw.hostname || "unknown-host",
    cpu: {
      usagePercent: Number(raw.cpu?.usagePercent ?? 0),
      cores: Number(raw.cpu?.cores ?? 0),
      perCore: Array.isArray(raw.cpu?.perCore) ? raw.cpu.perCore.map(Number) : [],
    },
    ram: {
      totalBytes: Number(raw.ram?.totalBytes ?? 0),
      usedBytes: Number(raw.ram?.usedBytes ?? 0),
      freeBytes: Number(raw.ram?.freeBytes ?? 0),
      usagePercent: Number(raw.ram?.usagePercent ?? 0),
    },
    disk: Array.isArray(raw.disk)
      ? raw.disk.map((d) => ({
          mount: d.mount,
          totalBytes: Number(d.totalBytes ?? 0),
          usedBytes: Number(d.usedBytes ?? 0),
          usagePercent: Number(d.usagePercent ?? 0),
        }))
      : [],
  };
}

