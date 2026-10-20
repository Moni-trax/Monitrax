const { Router } = require("express");
const dockerPoller = require("../services/dockerPoller");
const { getDockerSnapshot } = require("../collectors/dockerCollector");

const router = Router();

router.get("/", async (req, res) => {
  const cached = dockerPoller.getLastSnapshot();
  if (cached && cached.available !== undefined) {
    return res.json(cached);
  }

  const fresh = await getDockerSnapshot();
  res.json(fresh);
});

module.exports = router;
