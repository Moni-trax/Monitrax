const repo = require("../repositories/monitorRepository");

const MAX_HISTORY = 100;
const historyMap = new Map();
const timersMap = new Map();
let broadcastFn = null;

async function executeCheck(monitor) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), monitor.timeoutMs || 5000);

  const fetchOptions = {
    method: monitor.method || "GET",
    signal: controller.signal,
    headers: monitor.headers || {},
  };

  if (monitor.body && monitor.method !== "GET" && monitor.method !== "HEAD") {
    fetchOptions.body = typeof monitor.body === "string" ? monitor.body : JSON.stringify(monitor.body);
    if (!fetchOptions.headers["Content-Type"]) {
      fetchOptions.headers["Content-Type"] = "application/json";
    }
  }

  let ok = false;
  let statusCode = null;
  let error = null;

  try {
    const res = await fetch(monitor.url, fetchOptions);
    statusCode = res.status;
    ok = statusCode === (monitor.expectedStatus || 200);
  } catch (err) {
    ok = false;
    error = err.name === "AbortError" ? "Request timed out" : err.message;
  } finally {
    clearTimeout(timer);
  }

  const responseTimeMs = Date.now() - startTime;
  const result = {
    ts: new Date().toISOString(),
    ok,
    statusCode,
    responseTimeMs,
    error,
  };

  recordResult(monitor.id, result);

  if (broadcastFn) {
    broadcastFn("monitors", getAllWithStats());
  }

  return result;
}

function recordResult(monitorId, result) {
  if (!historyMap.has(monitorId)) {
    historyMap.set(monitorId, []);
  }
  const history = historyMap.get(monitorId);
  history.push(result);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
}

function computeStats(monitor) {
  const history = historyMap.get(monitor.id) || [];
  if (history.length === 0) {
    return {
      ...monitor,
      state: "pending",
      uptimePercent: null,
      avgResponseTimeMs: null,
      lastResponseTimeMs: null,
      lastChecked: null,
      lastError: null,
      recentResults: [],
    };
  }

  const latest = history[history.length - 1];
  const successfulCount = history.filter((r) => r.ok).length;
  const uptimePercent = parseFloat(((successfulCount / history.length) * 100).toFixed(1));
  const avgResponseTimeMs = Math.round(
    history.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / history.length
  );

  return {
    ...monitor,
    state: latest.ok ? "up" : "down",
    uptimePercent,
    avgResponseTimeMs,
    lastResponseTimeMs: latest.responseTimeMs,
    lastChecked: latest.ts,
    lastError: latest.error || null,
    recentResults: history.slice(-20),
  };
}

function getAllWithStats() {
  const monitors = repo.getAll();
  return monitors.map(computeStats);
}

function getHistory(monitorId) {
  return historyMap.get(monitorId) || [];
}

function scheduleMonitor(monitor) {
  stopMonitor(monitor.id);

  // Run immediate initial check without blocking
  executeCheck(monitor);

  const intervalMs = Math.max(monitor.intervalSec || 30, 5) * 1000;
  const timer = setInterval(() => {
    executeCheck(monitor);
  }, intervalMs);

  timersMap.set(monitor.id, timer);
}

function stopMonitor(monitorId) {
  if (timersMap.has(monitorId)) {
    clearInterval(timersMap.get(monitorId));
    timersMap.delete(monitorId);
  }
}

function start(broadcast) {
  broadcastFn = broadcast;
  const monitors = repo.getAll();
  monitors.forEach(scheduleMonitor);
}

function stop() {
  timersMap.forEach((timer) => clearInterval(timer));
  timersMap.clear();
}

module.exports = {
  start,
  stop,
  scheduleMonitor,
  stopMonitor,
  getAllWithStats,
  getHistory,
};
