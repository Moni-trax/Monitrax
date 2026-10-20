const { getSnapshot } = require("../collectors/systemMetrics");
const buffer = require("./metricsBuffer");
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
