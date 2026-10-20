const config = require("../config");
const { getDockerSnapshot } = require("../collectors/dockerCollector");
const anomalyDetector = require("./anomalyDetector");


let intervalId = null;
let lastSnapshot = { available: false, containers: [] };

function start(broadcast) {
  async function poll() {
    try {
      lastSnapshot = await getDockerSnapshot();
      if (lastSnapshot?.containers) {
        lastSnapshot.containers.forEach((c) => {
          anomalyDetector.checkSeries(`docker_${c.name}_cpu`, c.cpuPercent || 0, config.thresholdCpu);
          anomalyDetector.checkSeries(`docker_${c.name}_mem`, c.memPercent || 0, config.thresholdRam);
        });
      }
      if (broadcast) {
        broadcast("docker", lastSnapshot);
      }
    } catch {
      // Handled in collector
    }

  }

  poll();
  intervalId = setInterval(poll, config.dockerIntervalMs);
  console.log(`[dockerPoller] Polling Docker every ${config.dockerIntervalMs}ms`);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[dockerPoller] Stopped.");
  }
}

function getLastSnapshot() {
  return lastSnapshot;
}

module.exports = {
  start,
  stop,
  getLastSnapshot,
};
