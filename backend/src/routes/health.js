const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    uptime: parseFloat(process.uptime().toFixed(2)),
  });
});

module.exports = router;
