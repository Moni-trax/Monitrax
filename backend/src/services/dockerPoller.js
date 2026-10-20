const config = require("../config");
const { getDockerSnapshot } = require("../collectors/dockerCollector");

let intervalId = null;
let lastSnapshot = { available: false, containers: [] };

function start(broadcast) {
  async function poll() {
    try {
      lastSnapshot = await getDockerSnapshot();
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
