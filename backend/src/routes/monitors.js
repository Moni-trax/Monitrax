const { Router } = require("express");
const crypto = require("crypto");
const repo = require("../repositories/monitorRepository");
const scheduler = require("../services/monitorScheduler");

const router = Router();

function validateMonitorInput(body, isUpdate = false) {
  const errors = [];
  const { name, url, method, expectedStatus, intervalSec, timeoutMs, headers } = body;


  if (!isUpdate && (!name || typeof name !== "string" || !name.trim())) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  if (!isUpdate || url !== undefined) {
    if (!url || typeof url !== "string") {
      errors.push("Field 'url' must be a valid URL string.");
    } else {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          errors.push("URL protocol must be http: or https:.");
        }
      } catch {
        errors.push("Invalid URL format.");
      }
    }
  }

  if (method !== undefined && !["GET", "POST", "HEAD"].includes(method)) {
    errors.push("Field 'method' must be one of: GET, POST, HEAD.");
  }

  if (expectedStatus !== undefined) {
    const statusNum = Number(expectedStatus);
    if (!Number.isInteger(statusNum) || statusNum < 100 || statusNum > 599) {
      errors.push("Field 'expectedStatus' must be a valid HTTP status code (100-599).");
    }
  }

  if (intervalSec !== undefined) {
    const intervalNum = Number(intervalSec);
    if (!Number.isInteger(intervalNum) || intervalNum < 5) {
      errors.push("Field 'intervalSec' must be an integer >= 5 seconds.");
    }
  }

  if (timeoutMs !== undefined) {
    const timeoutNum = Number(timeoutMs);
    if (!Number.isInteger(timeoutNum) || timeoutNum < 100) {
      errors.push("Field 'timeoutMs' must be an integer >= 100 ms.");
    }
  }

  if (headers !== undefined && (typeof headers !== "object" || Array.isArray(headers))) {
    errors.push("Field 'headers' must be an object if provided.");
  }

  return errors;
}

router.get("/", (req, res) => {
  res.json(scheduler.getAllWithStats());
});

router.post("/", (req, res) => {
  const errors = validateMonitorInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const newMonitor = {
    id: crypto.randomUUID(),
    name: req.body.name.trim(),
    url: req.body.url.trim(),
    method: req.body.method || "GET",
    expectedStatus: Number(req.body.expectedStatus) || 200,
    intervalSec: Number(req.body.intervalSec) || 30,
    timeoutMs: Number(req.body.timeoutMs) || 5000,
    headers: req.body.headers || {},
    body: req.body.body || null,
    createdAt: new Date().toISOString(),
  };

  repo.create(newMonitor);
  scheduler.scheduleMonitor(newMonitor);

  res.status(201).json(newMonitor);
});

router.put("/:id", (req, res) => {
  const existing = repo.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  const errors = validateMonitorInput(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const updates = { ...req.body };
  if (updates.expectedStatus !== undefined) updates.expectedStatus = Number(updates.expectedStatus);
  if (updates.intervalSec !== undefined) updates.intervalSec = Number(updates.intervalSec);
  if (updates.timeoutMs !== undefined) updates.timeoutMs = Number(updates.timeoutMs);

  const updated = repo.update(req.params.id, updates);
  scheduler.scheduleMonitor(updated);

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const existing = repo.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  scheduler.stopMonitor(req.params.id);
  repo.remove(req.params.id);

  res.json({ message: "Monitor deleted successfully", id: req.params.id });
});

router.get("/:id/history", (req, res) => {
  const existing = repo.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  const history = scheduler.getHistory(req.params.id);
  res.json({ monitorId: req.params.id, count: history.length, results: history });
});

module.exports = router;
