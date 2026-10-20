const { Router } = require("express");
const logAnalyzer = require("../services/logAnalyzer");

const router = Router();

router.get("/summary", (req, res) => {
  res.json(logAnalyzer.getSummary());
});

router.get("/recent", (req, res) => {
  const { level, source, limit } = req.query;
  res.json(logAnalyzer.getRecentLogs({ level, source, limit }));
});

router.post("/ingest", (req, res) => {
  const { source, lines } = req.body;
  if (!Array.isArray(lines)) {
    return res.status(400).json({ error: "Field 'lines' must be an array of strings." });
  }
  if (lines.length > 500) {
    return res.status(400).json({ error: "Maximum 500 lines allowed per ingest request." });
  }

  const count = logAnalyzer.ingestLines(source || "api", lines);
  res.status(201).json({ message: "Logs ingested successfully", count });
});

module.exports = router;
