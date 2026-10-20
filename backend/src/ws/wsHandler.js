const { WebSocketServer, OPEN } = require("ws");
const config = require("../config");
const buffer = require("../services/metricsBuffer");

function init(httpServer, getInitialState = {}) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  console.log("[wsHandler] WebSocket server attached at path /ws");

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[wsHandler] Client connected: ${clientIp}`);

    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Send latest available state immediately
    const lastSnapshot = buffer.getLast();
    if (lastSnapshot) {
      send(ws, "metrics", lastSnapshot);
    }

    if (getInitialState.getMonitors) {
      send(ws, "monitors", getInitialState.getMonitors());
    }

    if (getInitialState.getDocker) {
      send(ws, "docker", getInitialState.getDocker());
    }

    ws.on("close", () => {
      console.log(`[wsHandler] Client disconnected: ${clientIp}`);
    });

    ws.on("error", (err) => {
      console.error(`[wsHandler] Socket error from ${clientIp}:`, err.message);
    });
  });

  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.warn("[wsHandler] Terminating dead WebSocket connection.");
        return ws.terminate();
      }

      ws.isAlive = false;
      // Protocol ping to detect hung connections
      ws.ping();
      // Application-level heartbeat frame for client watchdogs
      send(ws, "heartbeat", { ts: now });
    });
  }, config.heartbeatIntervalMs);

  function broadcast(type, data) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((ws) => {
      if (ws.readyState === OPEN) {
        ws.send(message);
      }
    });
  }

  function broadcastMetrics(snapshot) {
    broadcast("metrics", snapshot);
  }

  function close() {
    clearInterval(heartbeatInterval);
    wss.clients.forEach((ws) => {
      try {
        ws.close(1001, "Server shutting down");
      } catch {
        ws.terminate();
      }
    });
    wss.close();
  }

  return { broadcast, broadcastMetrics, close };
}

function send(ws, type, data) {
  if (ws.readyState === OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

module.exports = { init };
