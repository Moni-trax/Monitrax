const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/metrics", authMiddleware, (req, res) => {
  // Dummy data for Phase 1
  res.json({
    cpu: "45%",
    ram: "3.2 GB / 8.0 GB",
    disk: "120 GB / 256 GB",
    containers: 4,
    logs: [
      "System booted successfully",
      "Nginx restarted",
      "Database connected",
    ],
  });
});

module.exports = router;
