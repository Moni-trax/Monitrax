const express = require("express");
const {
  createTarget,
  getTargets,
  deleteTarget,
} = require("../controllers/targetController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// All target routes require authentication
router.use(authMiddleware);

router.post("/", createTarget);
router.get("/", getTargets);
router.delete("/:id", deleteTarget);

module.exports = router;
