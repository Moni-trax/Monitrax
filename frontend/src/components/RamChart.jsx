import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { bytesToGb } from "../utils/format";

export default function RamChart({ history, latestRam, anomalies = [] }) {
  const data = history.map((snap) => ({
    timestamp: typeof snap.timestamp === "number" ? snap.timestamp : new Date(snap.timestamp).getTime(),
    usage: snap.ram?.usagePercent ?? 0,

    used: snap.ram?.usedBytes ?? 0,
    total: snap.ram?.totalBytes ?? 0,
  }));

  function formatTime(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const usedFormatted = bytesToGb(latestRam?.usedBytes);
  const totalFormatted = bytesToGb(latestRam?.totalBytes);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Memory Usage</h3>
          <span className="card-subtitle">
            {usedFormatted} / {totalFormatted}
          </span>
        </div>
        <span className="card-badge">RAM %</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#bc8cff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#bc8cff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              formatter={(value, name, item) => [
                `${value}% (${bytesToGb(item.payload.used)} / ${bytesToGb(item.payload.total)})`,
                "RAM",
              ]}
            />
            {/* Shaded anomaly bands */}
            {anomalies
              .filter((a) => a.series === "ram_usage_percent" || a.series === "system_ram")
              .map((a) => {
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

            <Area
              type="monotone"
              dataKey="usage"
              stroke="#bc8cff"
              strokeWidth={2}
              fill="url(#ramGradient)"
              isAnimationActive={false}
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
