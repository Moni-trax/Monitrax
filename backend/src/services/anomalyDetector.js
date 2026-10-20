const crypto = require("crypto");
const config = require("../config");

// Stores state per series name
// { window: number[], sustainCount: number, recoveryCount: number, activeAnomaly: object|null }
const seriesState = new Map();
const anomaliesHistory = [];
let broadcastFn = null;

function setBroadcast(fn) {
  broadcastFn = fn;
}

function getSeriesState(series) {
  if (!seriesState.has(series)) {
    seriesState.set(series, {
      window: [],
      sustainCount: 0,
      recoveryCount: 0,
      activeAnomaly: null,
    });
  }
  return seriesState.get(series);
}

function calculateMeanStd(arr) {
  const n = arr.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = arr.reduce((acc, v) => acc + v, 0) / n;
  const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

function checkSeries(series, value, staticThreshold = null) {
  if (typeof value !== "number" || isNaN(value)) return;

  const state = getSeriesState(series);
  const { mean, std } = calculateMeanStd(state.window);
  const eps = 1e-4;

  let isZBreach = false;
  let z = 0;
  if (state.window.length >= config.anomalyMinSamples && std > eps) {
    z = (value - mean) / std;
    if (Math.abs(z) >= config.anomalyZThreshold) {
      isZBreach = true;
    }
  }

  let isThresholdBreach = false;
  if (staticThreshold !== null && value >= staticThreshold) {
    isThresholdBreach = true;
  }

  const isAnomalous = isZBreach || isThresholdBreach;

  if (isAnomalous) {
    state.recoveryCount = 0;
    state.sustainCount++;

    if (!state.activeAnomaly && state.sustainCount >= config.anomalySustain) {
      const kind = isThresholdBreach ? "threshold" : "zscore";
      const isCritical = Math.abs(z) >= 5 || isThresholdBreach;
      const severity = isCritical ? "critical" : "warning";

      let message = `${series} at ${value.toFixed(1)}% breached threshold (${staticThreshold}%)`;
      if (isZBreach) {
        message = `${series} at ${value.toFixed(1)} is ${Math.abs(z).toFixed(1)} standard deviations above recent average (${mean.toFixed(1)})`;
      }

      const anomaly = {
        id: crypto.randomUUID(),
        series,
        kind,
        severity,
        value: parseFloat(value.toFixed(2)),
        baselineMean: parseFloat(mean.toFixed(2)),
        baselineStd: parseFloat(std.toFixed(2)),
        zScore: parseFloat(z.toFixed(2)),
        startedAt: new Date().toISOString(),
        resolvedAt: null,
        status: "open",
        message,
      };

      state.activeAnomaly = anomaly;
      anomaliesHistory.unshift(anomaly);
      if (anomaliesHistory.length > config.anomalyHistory) {
        anomaliesHistory.pop();
      }

      notifyUpdate();
    }
  } else {
    state.sustainCount = 0;

    // Add normal points to the baseline window
    state.window.push(value);
    if (state.window.length > config.anomalyWindow) {
      state.window.shift();
    }

    if (state.activeAnomaly) {
      state.recoveryCount++;
      if (state.recoveryCount >= config.anomalyRecovery) {
        state.activeAnomaly.status = "resolved";
        state.activeAnomaly.resolvedAt = new Date().toISOString();
        state.activeAnomaly = null;
        state.recoveryCount = 0;
        notifyUpdate();
      }
    }
  }
}

function notifyUpdate() {
  if (broadcastFn) {
    broadcastFn("anomalies", {
      summary: getSummary(),
      recent: anomaliesHistory.slice(0, 50),
    });
  }
}

function getSummary() {
  const openAnomalies = anomaliesHistory.filter((a) => a.status === "open");
  return {
    open: openAnomalies.length,
    critical: openAnomalies.filter((a) => a.severity === "critical").length,
    warning: openAnomalies.filter((a) => a.severity === "warning").length,
    total: anomaliesHistory.length,
  };
}

function getAnomalies(statusFilter = "all") {
  if (statusFilter === "open") return anomaliesHistory.filter((a) => a.status === "open");
  if (statusFilter === "resolved") return anomaliesHistory.filter((a) => a.status === "resolved");
  return anomaliesHistory;
}

function simulatePoint(series, value, staticThreshold = null) {
  checkSeries(series, value, staticThreshold);
}

module.exports = {
  setBroadcast,
  checkSeries,
  getSummary,
  getAnomalies,
  simulatePoint,
};
