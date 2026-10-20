import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function CpuChart({ history }) {
  const data = history.map((snap) => ({
    time: new Date(snap.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    usage: snap.cpu?.usagePercent ?? 0,
  }));

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
              formatter={(value) => [`${value}%`, "CPU"]}
            />
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
