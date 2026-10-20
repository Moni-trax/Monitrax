import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { bytesToGb } from "../utils/format";

export default function RamChart({ history, latestRam }) {
  const data = history.map((snap) => ({
    time: new Date(snap.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    usage: snap.ram?.usagePercent ?? 0,
    used: snap.ram?.usedBytes ?? 0,
    total: snap.ram?.totalBytes ?? 0,
  }));

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
              dataKey="time"
              stroke="#525d6f"
              fontSize={11}
              tickLine={false}
              minTickGap={30}
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
              formatter={(value, name, item) => [
                `${value}% (${bytesToGb(item.payload.used)} / ${bytesToGb(item.payload.total)})`,
                "RAM",
              ]}
            />
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
