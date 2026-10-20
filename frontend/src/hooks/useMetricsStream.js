import { useEffect, useRef, useState } from "react";
import {
  fetchMetricsHistory,
  fetchMonitors,
  fetchDockerSnapshot,
} from "../services/api";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";
const WS_STALE_MS = parseInt(import.meta.env.VITE_WS_STALE_MS, 10) || 7000;
const MAX_POINTS = 120;
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;

export function useMetricsStream() {
  const [history, setHistory] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [docker, setDocker] = useState({ available: false, containers: [] });
  const [status, setStatus] = useState("connecting");
  const [lastUpdated, setLastUpdated] = useState(null);

  const wsRef = useRef(null);
  const connectionSeqRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_MS);
  const watchdogIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;

    async function prefillData() {
      try {
        const [historyRes, monitorsRes, dockerRes] = await Promise.allSettled([
          fetchMetricsHistory(),
          fetchMonitors(),
          fetchDockerSnapshot(),
        ]);

        if (isUnmountedRef.current) return;

        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value?.snapshots)) {
          setHistory(historyRes.value.snapshots.slice(-MAX_POINTS));
        }
        if (monitorsRes.status === "fulfilled" && Array.isArray(monitorsRes.value)) {
          setMonitors(monitorsRes.value);
        }
        if (dockerRes.status === "fulfilled" && dockerRes.value) {
          setDocker(dockerRes.value);
        }
      } catch {
        // Fall back to WebSocket broadcasts
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
          wsRef.current.close();
        } catch {
          // Ignore
        }
      }

      const ws = new WebSocket(WS_BASE);
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
            setHistory((prev) => {
              const next = [...prev, msg.data];
              return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
            });
          } else if (msg.type === "monitors" && Array.isArray(msg.data)) {
            setMonitors(msg.data);
          } else if (msg.type === "docker" && msg.data) {
            setDocker(msg.data);
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
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_MS);
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

    // Watchdog checking for silent drops or suspended tabs
    watchdogIntervalRef.current = setInterval(() => {
      if (isUnmountedRef.current) return;
      if (lastMessageTimeRef.current > 0 && Date.now() - lastMessageTimeRef.current > WS_STALE_MS) {
        setStatus("disconnected");
        if (wsRef.current) {
          try {
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
    status,
    lastUpdated,
  };
}
