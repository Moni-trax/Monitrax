const { Router } = require("express");
const anomalyDetector = require("../services/anomalyDetector");

const router = Router();

router.get("/summary", (req, res) => {
  res.json(anomalyDetector.getSummary());
});

router.get("/", (req, res) => {
  const status = req.query.status || "all";
  res.json(anomalyDetector.getAnomalies(status));
});

module.exports = router;
