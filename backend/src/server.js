require("dotenv").config();

const http = require("http");
const app = require("./app");
const config = require("./config");
const wsHandler = require("./ws/wsHandler");
const metricsPoller = require("./services/metricsPoller");
const monitorScheduler = require("./services/monitorScheduler");
const dockerPoller = require("./services/dockerPoller");

const server = http.createServer(app);

const { broadcast, broadcastMetrics, close: closeSockets } = wsHandler.init(server, {
  getMonitors: () => monitorScheduler.getAllWithStats(),
  getDocker: () => dockerPoller.getLastSnapshot(),
});

metricsPoller.start(broadcastMetrics);
monitorScheduler.start(broadcast);
dockerPoller.start(broadcast);

server.listen(config.port, () => {
  console.log(`[server] Monitrax backend running on http://localhost:${config.port}`);
  console.log(`[server] WebSocket endpoint: ws://localhost:${config.port}/ws`);
  console.log(`[server] Health check:        http://localhost:${config.port}/health`);
});

let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);

  metricsPoller.stop();
  monitorScheduler.stop();
  dockerPoller.stop();
  closeSockets();

  server.close(() => {
    console.log("[server] HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
