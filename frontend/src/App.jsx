import { useState } from "react";
import { useMetricsStream } from "./hooks/useMetricsStream";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import CpuChart from "./components/CpuChart";
import CoreGrid from "./components/CoreGrid";
import RamChart from "./components/RamChart";
import DiskList from "./components/DiskList";
import UptimeView from "./components/UptimeView";
import DockerView from "./components/DockerView";
import { fetchMonitors } from "./services/api";
import { bytesToGb, formatPercent, getStatusLevel } from "./utils/format";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const {
    latest,
    history,
    monitors,
    setMonitors,
    docker,
    status,
    lastUpdated,
  } = useMetricsStream();

  async function handleRefreshMonitors() {
    try {
      const data = await fetchMonitors();
      setMonitors(data);
    } catch {
      // Fallback
    }
  }

  const isDisconnected = status === "disconnected";

  if (!latest && monitors.length === 0 && !docker.available) {
    return (
      <div className="app-container">
        <Header
          hostname="connecting..."
          status={status}
          lastUpdated={lastUpdated}
        />
        <div className="loading-screen">
          <div className="spinner" />
          <p>
            {isDisconnected
              ? "Disconnected from Monitrax backend. Retrying..."
              : "Connecting to Monitrax stream..."}
          </p>
        </div>
      </div>
    );
  }

  const cpuPercent = latest?.cpu?.usagePercent ?? 0;
  const ramPercent = latest?.ram?.usagePercent ?? 0;
  const highestDiskPercent = Math.max(
    0,
    ...(latest?.disk || []).map((d) => d.usagePercent ?? 0)
  );

  return (
    <div className="app-container">
      <Header
        hostname={latest?.hostname}
        status={status}
        lastUpdated={lastUpdated}
      />

      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "uptime" ? "active" : ""}`}
          onClick={() => setActiveTab("uptime")}
        >
          Uptime & APIs ({monitors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "docker" ? "active" : ""}`}
          onClick={() => setActiveTab("docker")}
        >
          Docker ({docker.containers?.length || 0})
        </button>
      </div>

      {isDisconnected && (
        <div className="disconnect-banner">
          Connection lost. Reconnecting to Monitrax backend...
        </div>
      )}

      <main className={`content-area ${isDisconnected ? "content-dimmed" : ""}`}>
        {activeTab === "overview" && (
          <>
            <div className="stats-grid">
              <StatCard
                label="CPU Usage"
                value={formatPercent(cpuPercent)}
                subtext={`${latest?.cpu?.cores || 0} logical cores`}
                level={getStatusLevel(cpuPercent)}
              />
              <StatCard
                label="RAM Usage"
                value={formatPercent(ramPercent)}
                subtext={`${bytesToGb(latest?.ram?.usedBytes)} / ${bytesToGb(
                  latest?.ram?.totalBytes
                )}`}
                level={getStatusLevel(ramPercent)}
              />
              <StatCard
                label="Highest Disk"
                value={formatPercent(highestDiskPercent)}
                subtext={`${latest?.disk?.length || 0} filesystems monitored`}
                level={getStatusLevel(highestDiskPercent)}
              />
              <StatCard
                label="Core Count"
                value={latest?.cpu?.cores || 0}
                subtext="Available CPU threads"
                level="normal"
              />
            </div>

            <div className="charts-grid">
              <CpuChart history={history} />
              <RamChart history={history} latestRam={latest?.ram} />
            </div>

            <div className="details-grid">
              <CoreGrid perCore={latest?.cpu?.perCore || []} />
              <DiskList disks={latest?.disk || []} />
            </div>
          </>
        )}

        {activeTab === "uptime" && (
          <UptimeView
            monitors={monitors}
            onRefresh={handleRefreshMonitors}
          />
        )}

        {activeTab === "docker" && <DockerView docker={docker} />}
      </main>
    </div>
  );
}
