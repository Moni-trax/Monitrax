const { getSnapshot } = require("../collectors/systemMetrics");
const buffer = require("./metricsBuffer");
const anomalyDetector = require("./anomalyDetector");
const config = require("../config");

let _intervalId = null;

function start(broadcast) {
  if (_intervalId) {
    console.warn("[metricsPoller] Already running — ignoring duplicate start.");
    return;
  }

  console.log(
    `[metricsPoller] Starting poll every ${config.metricsIntervalMs}ms`
  );

  const tick = async () => {
    try {
      const snapshot = await getSnapshot();
      buffer.push(snapshot);

      if (snapshot.cpu) {
        anomalyDetector.checkSeries("cpu_usage_percent", snapshot.cpu.usagePercent, config.thresholdCpu);
      }
      if (snapshot.ram) {
        anomalyDetector.checkSeries("ram_usage_percent", snapshot.ram.usagePercent, config.thresholdRam);
      }
      if (Array.isArray(snapshot.disk)) {
        snapshot.disk.forEach((d) => {
          anomalyDetector.checkSeries(`disk_usage_${d.mount}`, d.usagePercent, config.thresholdDisk);
        });
      }

      broadcast(snapshot);
    } catch (err) {
      console.error("[metricsPoller] Failed to collect metrics:", err.message);
    }
  };


  tick();
  _intervalId = setInterval(tick, config.metricsIntervalMs);
}

function stop() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log("[metricsPoller] Stopped.");
  }
}

module.exports = { start, stop };
