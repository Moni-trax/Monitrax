const fs = require("fs");
const crypto = require("crypto");
const config = require("../config");
const anomalyDetector = require("./anomalyDetector");

const recentLogs = [];
const patternsMap = new Map();
const perMinuteCounts = new Map();
const MAX_RECENT_LOGS = 1000;
const MAX_PATTERNS = 200;

let broadcastFn = null;
let broadcastInterval = null;
let errorRateInterval = null;
const warnedFiles = new Set();
const fileTailers = new Map();

function setBroadcast(fn) {
  broadcastFn = fn;
}

function normalizeToPattern(msg) {
  if (typeof msg !== "string") return String(msg);
  return msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<UUID>")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "<IP>")
    .replace(/\b0x[0-9a-f]+\b/gi, "<HEX>")
    .replace(/"[^"]*"/g, '"<STR>"')
    .replace(/'[^']*'/g, "'<STR>'")
    .replace(/\b\d+\b/g, "<NUM>")
    .trim();
}

function parseLine(rawLine, source = "backend") {
  const line = String(rawLine).trim();
  if (!line) return null;

  let level = "INFO";
  let message = line;
  let timestamp = new Date().toISOString();

  // JSON log parsing support
  if (line.startsWith("{") && line.endsWith("}")) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.level) level = String(parsed.level).toUpperCase();
      if (parsed.msg || parsed.message) message = String(parsed.msg || parsed.message);
      if (parsed.timestamp || parsed.time) timestamp = new Date(parsed.timestamp || parsed.time).toISOString();
    } catch {
      // Fall through to plain text parsing
    }
  } else {
    // Regex detection for levels
    if (/\b(ERROR|ERR|FATAL)\b/i.test(line)) {
      level = "ERROR";
    } else if (/\b(WARN|WARNING)\b/i.test(line)) {
      level = "WARN";
    } else if (/\b(DEBUG)\b/i.test(line)) {
      level = "DEBUG";
    } else if (/\b(INFO)\b/i.test(line)) {
      level = "INFO";
    }

    // Try extracting ISO or typical timestamp
    const tsMatch = line.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/);
    if (tsMatch) {
      try {
        timestamp = new Date(tsMatch[0]).toISOString();
      } catch {
        // Keep fallback
      }
    }

    // Strip [timestamp] and [level] prefixes from message
    message = line
      .replace(/^\[[^\]]+\]\s*/, "")
      .replace(/^\[(ERROR|ERR|FATAL|WARN|WARNING|INFO|DEBUG)\]\s*/i, "")
      .trim();

  }

  // Normalize level names
  if (["ERR", "FATAL"].includes(level)) level = "ERROR";
  if (level === "WARNING") level = "WARN";
  if (!["ERROR", "WARN", "INFO", "DEBUG"].includes(level)) level = "INFO";

  return {
    id: crypto.randomUUID(),
    source,
    level,
    message,
    raw: line,
    timestamp,
  };
}

function recordLog(entry) {
  if (!entry) return;

  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_RECENT_LOGS) {
    recentLogs.pop();
  }

  // Per-minute tracking
  const minKey = entry.timestamp.slice(0, 16); // "YYYY-MM-DDTHH:mm"
  if (!perMinuteCounts.has(minKey)) {
    perMinuteCounts.set(minKey, { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 });
  }
  const minObj = perMinuteCounts.get(minKey);
  minObj[entry.level] = (minObj[entry.level] || 0) + 1;

  // Pattern analysis for errors
  if (entry.level === "ERROR") {
    const pattern = normalizeToPattern(entry.message);
    const now = Date.now();
    const isExisting = patternsMap.has(pattern);

    if (isExisting) {
      const p = patternsMap.get(pattern);
      p.count++;
      p.lastSeen = entry.timestamp;
      p.sample = entry.message;
    } else {
      // Evict least recently seen if capped
      if (patternsMap.size >= MAX_PATTERNS) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [k, v] of patternsMap.entries()) {
          const t = new Date(v.lastSeen).getTime();
          if (t < oldestTime) {
            oldestTime = t;
            oldestKey = k;
          }
        }
        if (oldestKey) patternsMap.delete(oldestKey);
      }

      patternsMap.set(pattern, {
        pattern,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        sample: entry.message,
        isNew: true,
      });
    }

    // Flag as new pattern if first seen within the last 60 minutes
    const patObj = patternsMap.get(pattern);
    const ageMs = now - new Date(patObj.firstSeen).getTime();
    patObj.isNew = ageMs <= 60 * 60 * 1000 && patObj.count <= 10;
  }
}

function ingestLines(source, lines) {
  if (!Array.isArray(lines)) return 0;
  let count = 0;
  for (const line of lines) {
    const entry = parseLine(line, source);
    if (entry) {
      recordLog(entry);
      count++;
    }
  }
  return count;
}

function getSummary() {
  const now = new Date();
  const perMinute = [];

  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60000);
    const key = d.toISOString().slice(0, 16);
    const counts = perMinuteCounts.get(key) || { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
    perMinute.push({ minute: key.slice(11), ...counts });
  }

  const allPatterns = Array.from(patternsMap.values());
  allPatterns.sort((a, b) => b.count - a.count);

  return {
    perMinute,
    topPatterns: allPatterns.slice(0, 10),
    newPatterns: allPatterns.filter((p) => p.isNew).slice(0, 5),
    totalLogs: recentLogs.length,
  };
}

function getRecentLogs(filter = {}) {
  const { level, source, limit = 100 } = filter;
  let res = recentLogs;
  if (level) {
    res = res.filter((l) => l.level === level.toUpperCase());
  }
  if (source) {
    res = res.filter((l) => l.source === source);
  }
  return res.slice(0, Math.min(Number(limit) || 100, 500));
}

// File tailing
function setupFileTailing() {
  config.logFiles.forEach((filePath) => {
    tailFile(filePath);
  });
}

function tailFile(filePath) {
  if (fileTailers.has(filePath)) return;

  let lastSize = 0;
  let retryTimer = null;

  function poll() {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (!warnedFiles.has(filePath)) {
          console.warn(`[logAnalyzer] Log file not found (will retry every 10s): ${filePath}`);
          warnedFiles.add(filePath);
        }
        lastSize = 0;
        retryTimer = setTimeout(poll, 10000);
        return;
      }

      if (warnedFiles.has(filePath)) {
        warnedFiles.delete(filePath);
      }

      // Handle rotation or first run
      if (lastSize === 0) {
        lastSize = stats.size;
        retryTimer = setTimeout(poll, 1000);
        return;
      }

      if (stats.size < lastSize) {
        // Truncated / rotated
        lastSize = 0;
        retryTimer = setTimeout(poll, 1000);
        return;
      }

      if (stats.size > lastSize) {
        const stream = fs.createReadStream(filePath, {
          start: lastSize,
          end: stats.size,
          encoding: "utf-8",
        });

        let chunk = "";
        stream.on("data", (d) => {
          chunk += d;
        });

        stream.on("end", () => {
          lastSize = stats.size;
          const lines = chunk.split("\n");
          lines.forEach((l) => {
            if (l.trim()) {
              const entry = parseLine(l, filePath);
              recordLog(entry);
            }
          });
        });
      }

      retryTimer = setTimeout(poll, 1000);
    });
  }

  poll();
  fileTailers.set(filePath, { stop: () => clearTimeout(retryTimer) });
}

function start(broadcast) {
  setBroadcast(broadcast);
  setupFileTailing();

  broadcastInterval = setInterval(() => {
    if (broadcastFn) {
      broadcastFn("logs", getSummary());
    }
  }, config.logBroadcastMs);

  // Compute error rate per minute and feed into anomaly detector
  errorRateInterval = setInterval(() => {
    const currentMinKey = new Date().toISOString().slice(0, 16);
    const counts = perMinuteCounts.get(currentMinKey);
    const errorCount = counts?.ERROR || 0;
    anomalyDetector.checkSeries("log_error_rate", errorCount, 20);
  }, 60000);
}

function stop() {
  if (broadcastInterval) clearInterval(broadcastInterval);
  if (errorRateInterval) clearInterval(errorRateInterval);
  fileTailers.forEach((t) => t.stop());
  fileTailers.clear();
}

module.exports = {
  start,
  stop,
  parseLine,
  recordLog,
  ingestLines,
  getSummary,
  getRecentLogs,
};
