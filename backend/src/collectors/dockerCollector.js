const si = require("systeminformation");

let loggedUnavailable = false;

async function getDockerSnapshot() {
  try {
    const containers = await si.dockerContainers(true);

    if (!Array.isArray(containers)) {
      if (!loggedUnavailable) {
        console.warn("[dockerCollector] Docker is not available on this host.");
        loggedUnavailable = true;
      }
      return { available: false, containers: [] };
    }

    const containerStats = await Promise.all(
      containers.map(async (c) => {
        let stats = null;
        if (c.state === "running") {
          try {
            stats = await si.dockerContainerStats(c.id);
          } catch {
            // Container may have stopped between calls
          }
        }

        return {
          id: c.id,
          name: c.name,
          image: c.image,
          state: c.state,
          status: c.status || c.state,
          startedAt: c.started ? new Date(c.started * 1000).toISOString() : null,
          cpuPercent: stats?.cpuPercent ? parseFloat(stats.cpuPercent.toFixed(2)) : 0,
          memUsageBytes: stats?.memUsage ?? 0,
          memLimitBytes: stats?.memLimit ?? 0,
          memPercent: stats?.memPercent ? parseFloat(stats.memPercent.toFixed(2)) : 0,
          netRxBytes: stats?.netIO?.rx ?? 0,
          netTxBytes: stats?.netIO?.tx ?? 0,
        };
      })
    );

    return {
      available: true,
      containers: containerStats,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (!loggedUnavailable) {
      console.warn("[dockerCollector] Docker is not available or daemon is not running:", err.message);
      loggedUnavailable = true;
    }
    return { available: false, containers: [] };
  }
}

module.exports = { getDockerSnapshot };
