const { Router } = require("express");
const anomalyDetector = require("../services/anomalyDetector");

const router = Router();

router.post("/simulate-anomaly", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Dev endpoints are disabled in production" });
  }

  const { series, value, count = 3 } = req.body;
  if (!series || typeof value !== "number") {
    return res.status(400).json({ error: "Fields 'series' (string) and 'value' (number) are required" });
  }

  for (let i = 0; i < Number(count); i++) {
    anomalyDetector.simulatePoint(series, value, 90.0);
  }

  res.json({
    message: `Simulated ${count} points for series ${series} with value ${value}`,
    summary: anomalyDetector.getSummary(),
  });
});

module.exports = router;
