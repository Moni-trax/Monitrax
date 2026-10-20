const client = require("prom-client");
const buffer = require("./metricsBuffer");
const monitorScheduler = require("./monitorScheduler");
const dockerPoller = require("./dockerPoller");
const anomalyDetector = require("./anomalyDetector");
const logAnalyzer = require("./logAnalyzer");

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Metrics
const cpuUsageGauge = new client.Gauge({
  name: "monitrax_cpu_usage_percent",
  help: "Overall CPU usage percentage",
  registers: [register],
});

const ramUsageGauge = new client.Gauge({
  name: "monitrax_ram_usage_percent",
  help: "RAM usage percentage",
  registers: [register],
});

const diskUsageGauge = new client.Gauge({
  name: "monitrax_disk_usage_percent",
  help: "Disk usage percentage per mount",
  labelNames: ["mount"],
  registers: [register],
});

const monitorUpGauge = new client.Gauge({
  name: "monitrax_monitor_up",
  help: "Monitor state: 1 for up, 0 for down",
  labelNames: ["name"],
  registers: [register],
});

const monitorResponseTimeGauge = new client.Gauge({
  name: "monitrax_monitor_response_time_ms",
  help: "Last response time in milliseconds",
  labelNames: ["name"],
  registers: [register],
});

const monitorUptimePercentGauge = new client.Gauge({
  name: "monitrax_monitor_uptime_percent",
  help: "Monitor uptime percentage",
  labelNames: ["name"],
  registers: [register],
});

const dockerCpuGauge = new client.Gauge({
  name: "monitrax_docker_container_cpu_percent",
  help: "Docker container CPU percent",
  labelNames: ["name"],
  registers: [register],
});

const dockerMemGauge = new client.Gauge({
  name: "monitrax_docker_container_memory_percent",
  help: "Docker container memory percent",
  labelNames: ["name"],
  registers: [register],
});

const anomaliesOpenGauge = new client.Gauge({
  name: "monitrax_anomalies_open",
  help: "Count of currently open anomalies",
  labelNames: ["severity"],
  registers: [register],
});

const anomaliesTotalCounter = new client.Counter({
  name: "monitrax_anomalies_total",
  help: "Total anomalies recorded",
  labelNames: ["series", "severity"],
  registers: [register],
});

const logEventsTotalCounter = new client.Counter({
  name: "monitrax_log_events_total",
  help: "Total log events parsed",
  labelNames: ["level"],
  registers: [register],
});

function updateGauges() {
  const latestMetrics = buffer.getLast();
  if (latestMetrics) {
    if (latestMetrics.cpu) cpuUsageGauge.set(latestMetrics.cpu.usagePercent || 0);
    if (latestMetrics.ram) ramUsageGauge.set(latestMetrics.ram.usagePercent || 0);
    if (Array.isArray(latestMetrics.disk)) {
      latestMetrics.disk.forEach((d) => {
        diskUsageGauge.labels(d.mount).set(d.usagePercent || 0);
      });
    }
  }

  const monitors = monitorScheduler.getAllWithStats();
  monitors.forEach((m) => {
    monitorUpGauge.labels(m.name).set(m.state === "up" ? 1 : 0);
    if (m.lastResponseTimeMs !== null) {
      monitorResponseTimeGauge.labels(m.name).set(m.lastResponseTimeMs);
    }
    if (m.uptimePercent !== null) {
      monitorUptimePercentGauge.labels(m.name).set(m.uptimePercent);
    }
  });

  const dockerSnapshot = dockerPoller.getLastSnapshot();
  if (dockerSnapshot?.containers) {
    dockerSnapshot.containers.forEach((c) => {
      dockerCpuGauge.labels(c.name).set(c.cpuPercent || 0);
      dockerMemGauge.labels(c.name).set(c.memPercent || 0);
    });
  }

  const summary = anomalyDetector.getSummary();
  anomaliesOpenGauge.labels("critical").set(summary.critical);
  anomaliesOpenGauge.labels("warning").set(summary.warning);

  const logsSummary = logAnalyzer.getSummary();
  // Update log counters from per-minute totals
  let totalErrors = 0;
  let totalWarns = 0;
  let totalInfos = 0;
  logsSummary.perMinute.forEach((pm) => {
    totalErrors += pm.ERROR || 0;
    totalWarns += pm.WARN || 0;
    totalInfos += pm.INFO || 0;
  });
  logEventsTotalCounter.reset();
  if (totalErrors > 0) logEventsTotalCounter.labels("ERROR").inc(totalErrors);
  if (totalWarns > 0) logEventsTotalCounter.labels("WARN").inc(totalWarns);
  if (totalInfos > 0) logEventsTotalCounter.labels("INFO").inc(totalInfos);
}

async function getMetricsText() {
  updateGauges();
  return register.metrics();
}

function getContentType() {
  return register.contentType;
}

module.exports = {
  getMetricsText,
  getContentType,
  anomaliesTotalCounter,
};
