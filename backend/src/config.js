module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  metricsIntervalMs: parseInt(process.env.METRICS_INTERVAL_MS, 10) || 1000,
  historySize: parseInt(process.env.HISTORY_SIZE, 10) || 300,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS, 10) || 3000,
  dockerIntervalMs: parseInt(process.env.DOCKER_INTERVAL_MS, 10) || 5000,

  // Anomaly detection
  anomalyWindow: parseInt(process.env.ANOMALY_WINDOW, 10) || 60,
  anomalyMinSamples: parseInt(process.env.ANOMALY_MIN_SAMPLES, 10) || 30,
  anomalyZThreshold: parseFloat(process.env.ANOMALY_Z_THRESHOLD) || 3.0,
  anomalySustain: parseInt(process.env.ANOMALY_SUSTAIN, 10) || 3,
  anomalyRecovery: parseInt(process.env.ANOMALY_RECOVERY, 10) || 5,
  anomalyHistory: parseInt(process.env.ANOMALY_HISTORY, 10) || 200,
  thresholdCpu: parseFloat(process.env.THRESHOLD_CPU) || 90.0,
  thresholdRam: parseFloat(process.env.THRESHOLD_RAM) || 90.0,
  thresholdDisk: parseFloat(process.env.THRESHOLD_DISK) || 90.0,

  // Logs
  logFiles: process.env.LOG_FILES ? process.env.LOG_FILES.split(",").map((s) => s.trim()).filter(Boolean) : [],
  logBroadcastMs: parseInt(process.env.LOG_BROADCAST_MS, 10) || 5000,
};



