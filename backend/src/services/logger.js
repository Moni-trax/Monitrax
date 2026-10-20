const logAnalyzer = require("./logAnalyzer");

function formatArgs(args) {
  return args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");
}

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function capture(level, args) {
  const msg = formatArgs(args);
  const entry = logAnalyzer.parseLine(`[${level}] ${msg}`, "backend");
  if (entry) {
    logAnalyzer.recordLog(entry);
  }
}

console.log = (...args) => {
  originalLog.apply(console, args);
  capture("INFO", args);
};

console.warn = (...args) => {
  originalWarn.apply(console, args);
  capture("WARN", args);
};

console.error = (...args) => {
  originalError.apply(console, args);
  capture("ERROR", args);
};

module.exports = {
  info: console.log,
  warn: console.warn,
  error: console.error,
};
