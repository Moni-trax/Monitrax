const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");

const healthRouter = require("./routes/health");
const metricsRouter = require("./routes/metrics");
const monitorsRouter = require("./routes/monitors");
const dockerRouter = require("./routes/docker");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/health", healthRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/monitors", monitorsRouter);
app.use("/api/docker", dockerRouter);


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[app] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
