const fs = require("fs");
const path = require("path");

const logFile = path.resolve(process.cwd(), "sample.log");
const isBurst = process.argv.includes("--burst");

const sampleInfos = [
  "GET /api/metrics 200 OK - 12ms",
  "User admin logged in from 192.168.1.100",
  "Background metrics collection cycle completed in 45ms",
  "Cache sync completed: 154 keys updated",
  "Healthcheck ping responded with status 200",
];

const sampleWarns = [
  "Slow response detected on /api/monitors: 480ms",
  "Disk storage on /var/log exceeds 75% capacity",
  "Client connection disconnected unexpectedly",
];

const normalErrors = [
  "Database connection timeout on pool worker #3",
  "Failed to resolve hostname api.thirdparty.com: query timed out",
];

const burstErrorPattern = "FATAL: Connection pool exhausted for tenant 0x8f4c2e during transaction";

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLine(level, msg) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}] ${msg}\n`;
}

if (isBurst) {
  console.log(`[fake-logger] Emitting burst of 50 new fatal error patterns into ${logFile}...`);
  let content = "";
  for (let i = 0; i < 50; i++) {
    content += generateLine("ERROR", `${burstErrorPattern} #${i + 1}`);
  }
  fs.appendFileSync(logFile, content, "utf-8");
  console.log("[fake-logger] Burst written.");
  process.exit(0);
}

console.log(`[fake-logger] Appending realistic log lines to ${logFile} every 1s... (Press Ctrl+C to stop)`);

setInterval(() => {
  const rand = Math.random();
  let line = "";
  if (rand < 0.7) {
    line = generateLine("INFO", getRandomItem(sampleInfos));
  } else if (rand < 0.9) {
    line = generateLine("WARN", getRandomItem(sampleWarns));
  } else {
    line = generateLine("ERROR", getRandomItem(normalErrors));
  }

  fs.appendFileSync(logFile, line, "utf-8");
}, 1000);
