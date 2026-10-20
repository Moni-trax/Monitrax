import { useEffect, useRef, useState } from "react";
import {
  fetchMetricsHistory,
  fetchMonitors,
  fetchDockerSnapshot,
  fetchAnomalies,
  fetchAnomaliesSummary,
  fetchLogsSummary,
} from "../services/api";
import { normalizeSnapshot } from "../utils/format";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";
const WS_STALE_MS = parseInt(import.meta.env.VITE_WS_STALE_MS, 10) || 7000;
const MAX_POINTS = 120;
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;

export function useMetricsStream() {
  const [history, setHistory] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [docker, setDocker] = useState({ available: false, containers: [] });
  const [anomalies, setAnomalies] = useState({ summary: { open: 0, critical: 0, warning: 0, total: 0 }, recent: [] });
  const [logs, setLogs] = useState({ perMinute: [], topPatterns: [], newPatterns: [], totalLogs: 0 });
  const [status, setStatus] = useState("connecting");
  const [lastUpdated, setLastUpdated] = useState(null);

  const wsRef = useRef(null);
  const connectionSeqRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_MS);
  const watchdogIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const pendingBufferRef = useRef([]);
  const isPrefillDoneRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    isPrefillDoneRef.current = false;
    pendingBufferRef.current = [];

    function mergePoints(existing, incoming) {
      const map = new Map();
      for (const p of existing) {
        if (p?.timestamp) map.set(p.timestamp, p);
      }
      for (const p of incoming) {
        const norm = normalizeSnapshot(p);
        if (norm?.timestamp) map.set(norm.timestamp, norm);
      }
      return Array.from(map.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-MAX_POINTS);
    }

    async function prefillData() {
      try {
        const [historyRes, monitorsRes, dockerRes, anomaliesRes, summaryRes, logsRes] = await Promise.allSettled([
          fetchMetricsHistory(),
          fetchMonitors(),
          fetchDockerSnapshot(),
          fetchAnomalies("all"),
          fetchAnomaliesSummary(),
          fetchLogsSummary(),
        ]);

        if (isUnmountedRef.current) return;

        let fetchedSnapshots = [];
        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value?.snapshots)) {
          fetchedSnapshots = historyRes.value.snapshots;
        }

        const buffered = pendingBufferRef.current;
        pendingBufferRef.current = [];
        isPrefillDoneRef.current = true;

        setHistory((prev) => mergePoints(prev, [...fetchedSnapshots, ...buffered]));

        if (monitorsRes.status === "fulfilled" && Array.isArray(monitorsRes.value)) {
          setMonitors(monitorsRes.value);
        }
        if (dockerRes.status === "fulfilled" && dockerRes.value) {
          setDocker(dockerRes.value);
        }

        const recentAnoms = anomaliesRes.status === "fulfilled" && Array.isArray(anomaliesRes.value) ? anomaliesRes.value : [];
        const sumAnoms = summaryRes.status === "fulfilled" && summaryRes.value ? summaryRes.value : { open: 0, critical: 0, warning: 0, total: 0 };
        setAnomalies({ summary: sumAnoms, recent: recentAnoms });

        if (logsRes.status === "fulfilled" && logsRes.value) {
          setLogs(logsRes.value);
        }
      } catch {
        isPrefillDoneRef.current = true;
      }
    }

    prefillData();

    function connect() {
      if (isUnmountedRef.current || !navigator.onLine) {
        if (!navigator.onLine) setStatus("disconnected");
        return;
      }

      const seq = ++connectionSeqRef.current;
      setStatus("connecting");

      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close();
        } catch {
          // Ignore
        }
      }

      let ws;
      try {
        ws = new WebSocket(WS_BASE);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current || connectionSeqRef.current !== seq) {
          ws.close();
          return;
        }
        setStatus("live");
        retryDelayRef.current = INITIAL_RETRY_MS;
        lastMessageTimeRef.current = Date.now();
        setLastUpdated(new Date());
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current || connectionSeqRef.current !== seq) return;

        const now = Date.now();
        lastMessageTimeRef.current = now;
        setLastUpdated(new Date(now));
        setStatus("live");

        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "metrics" && msg.data) {
            if (!isPrefillDoneRef.current) {
              pendingBufferRef.current.push(msg.data);
            } else {
              setHistory((prev) => mergePoints(prev, [msg.data]));
            }
          } else if (msg.type === "monitors" && Array.isArray(msg.data)) {
            setMonitors(msg.data);
          } else if (msg.type === "docker" && msg.data) {
            setDocker(msg.data);
          } else if (msg.type === "anomalies" && msg.data) {
            setAnomalies((prev) => ({
              summary: msg.data.summary || prev.summary,
              recent: msg.data.recent || prev.recent,
            }));
          } else if (msg.type === "logs" && msg.data) {
            setLogs(msg.data);
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      ws.onclose = () => {
        if (isUnmountedRef.current || connectionSeqRef.current !== seq) return;
        setStatus("disconnected");
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (isUnmountedRef.current || connectionSeqRef.current !== seq) return;
        setStatus("disconnected");
        try {
          ws.close();
        } catch {
          // Ignore
        }
      };
    }

    function scheduleReconnect() {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      const delay = retryDelayRef.current;
      retryTimeoutRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, MAX_RETRY_MS);
        connect();
      }, delay);
    }

    function handleOnline() {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryDelayRef.current = INITIAL_RETRY_MS;
      connect();
    }

    function handleOffline() {
      setStatus("disconnected");
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // Ignore
        }
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    watchdogIntervalRef.current = setInterval(() => {
      if (isUnmountedRef.current) return;
      if (
        lastMessageTimeRef.current > 0 &&
        Date.now() - lastMessageTimeRef.current > WS_STALE_MS
      ) {
        setStatus("disconnected");
        lastMessageTimeRef.current = 0;
        if (wsRef.current) {
          try {
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.close();
          } catch {
            // Ignore
          }
        }
        scheduleReconnect();
      }
    }, 1500);

    connect();

    return () => {
      isUnmountedRef.current = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  return {
    latest,
    history,
    monitors,
    setMonitors,
    docker,
    anomalies,
    setAnomalies,
    logs,
    status,
    lastUpdated,
  };
}
