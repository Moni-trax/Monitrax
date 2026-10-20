const si = require("systeminformation");
const os = require("os");

async function getSnapshot() {
  const [cpuLoad, mem, fsSizes] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    cpu: {
      usagePercent: parseFloat(cpuLoad.currentLoad.toFixed(2)),
      cores: cpuLoad.cpus.length,
      perCore: cpuLoad.cpus.map((core) => parseFloat(core.load.toFixed(2))),
    },
    ram: {
      totalBytes: mem.total,
      usedBytes: mem.active,
      freeBytes: mem.available,
      usagePercent: parseFloat(((mem.active / mem.total) * 100).toFixed(2)),
    },
    disk: fsSizes
      .filter((fs) => fs.size > 0)
      .map((fs) => ({
        mount: fs.mount,
        totalBytes: fs.size,
        usedBytes: fs.used,
        usagePercent: parseFloat(fs.use.toFixed(2)),
      })),
  };
}

module.exports = { getSnapshot };
