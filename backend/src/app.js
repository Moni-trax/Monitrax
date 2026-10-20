const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");

const healthRouter = require("./routes/health");
const metricsRouter = require("./routes/metrics");
const monitorsRouter = require("./routes/monitors");
const dockerRouter = require("./routes/docker");
const anomaliesRouter = require("./routes/anomalies");
const logsRouter = require("./routes/logs");
const devRouter = require("./routes/dev");
const prometheus = require("./services/prometheus");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

// Prometheus text metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", prometheus.getContentType());
    res.end(await prometheus.getMetricsText());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

app.use("/health", healthRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/monitors", monitorsRouter);
app.use("/api/docker", dockerRouter);
app.use("/api/anomalies", anomaliesRouter);
app.use("/api/logs", logsRouter);
app.use("/api/dev", devRouter);



app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[app] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
