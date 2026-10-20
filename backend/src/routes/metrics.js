const { Router } = require("express");
const { getSnapshot } = require("../collectors/systemMetrics");
const buffer = require("../services/metricsBuffer");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await getSnapshot();
    res.json(snapshot);
  } catch (err) {
    console.error("[metrics route] Snapshot error:", err.message);
    res.status(500).json({
      error: "Failed to collect metrics",
      detail: err.message,
    });
  }
});

router.get("/history", (req, res) => {
  const history = buffer.getAll();
  res.json({
    count: history.length,
    snapshots: history,
  });
});

module.exports = router;
