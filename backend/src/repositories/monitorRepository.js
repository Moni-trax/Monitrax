const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const MONITORS_FILE = path.join(DATA_DIR, "monitors.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MONITORS_FILE)) {
    fs.writeFileSync(MONITORS_FILE, JSON.stringify([]), "utf-8");
  }
}

function getAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(MONITORS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[monitorRepository] Error reading file, resetting:", err.message);
    return [];
  }
}

function saveAll(monitors) {
  ensureFile();
  fs.writeFileSync(MONITORS_FILE, JSON.stringify(monitors, null, 2), "utf-8");
}

function getById(id) {
  const monitors = getAll();
  return monitors.find((m) => m.id === id) || null;
}

function create(monitorData) {
  const monitors = getAll();
  monitors.push(monitorData);
  saveAll(monitors);
  return monitorData;
}

function update(id, updates) {
  const monitors = getAll();
  const index = monitors.findIndex((m) => m.id === id);
  if (index === -1) return null;

  monitors[index] = { ...monitors[index], ...updates, id };
  saveAll(monitors);
  return monitors[index];
}

function remove(id) {
  const monitors = getAll();
  const filtered = monitors.filter((m) => m.id !== id);
  if (filtered.length === monitors.length) return false;

  saveAll(filtered);
  return true;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
