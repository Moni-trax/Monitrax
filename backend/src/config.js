module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  metricsIntervalMs: parseInt(process.env.METRICS_INTERVAL_MS, 10) || 1000,
  historySize: parseInt(process.env.HISTORY_SIZE, 10) || 300,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS, 10) || 3000,
  dockerIntervalMs: parseInt(process.env.DOCKER_INTERVAL_MS, 10) || 5000,
};


