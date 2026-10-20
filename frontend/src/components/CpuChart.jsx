import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

export default function CpuChart({ history, anomalies = [] }) {
  const data = history.map((snap) => ({
    timestamp: typeof snap.timestamp === "number" ? snap.timestamp : new Date(snap.timestamp).getTime(),
    usage: snap.cpu?.usagePercent ?? 0,
  }));

  function formatTime(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Filter anomalies relevant to CPU
  const cpuAnomalies = anomalies.filter(
    (a) => a.series === "cpu_usage_percent" || a.series === "system_cpu"
  );

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h3 className="card-title">CPU Usage</h3>
        <span className="card-badge">Overall %</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid stroke="#262c36" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatTime}
              stroke="#525d6f"
              fontSize={11}
              tickLine={false}
              minTickGap={35}
            />
            <YAxis
              stroke="#525d6f"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "6px",
                color: "#e6edf3",
                fontSize: "12px",
              }}
              labelFormatter={(ts) => formatTime(ts)}
              formatter={(value) => [`${value}%`, "CPU"]}
            />

            {/* Shaded anomaly bands */}
            {cpuAnomalies.map((a) => {
              const startX = new Date(a.startedAt).getTime();
              const endX = a.resolvedAt ? new Date(a.resolvedAt).getTime() : Date.now();
              return (
                <ReferenceArea
                  key={a.id}
                  x1={startX}
                  x2={endX}
                  fill={a.severity === "critical" ? "#f87171" : "#fbbf24"}
                  fillOpacity={0.25}
                  stroke={a.severity === "critical" ? "#f87171" : "#fbbf24"}
                  strokeDasharray="3 3"
                />
              );
            })}

            <Line
              type="monotone"
              dataKey="usage"
              stroke="#58a6ff"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
