import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Status: Healthy
          </span>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="CPU Usage" value="45%" subtitle="Normal load" />
          <StatCard
            title="RAM Usage"
            value="3.2 / 8.0 GB"
            subtitle="40% utilized"
          />
          <StatCard
            title="Disk Usage"
            value="120 / 256 GB"
            subtitle="136 GB free"
          />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Docker Dummy Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Active Containers
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">api-server</span>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Running
                </span>
              </li>
              <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">redis-cache</span>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Running
                </span>
              </li>
            </ul>
          </div>

          {/* Logs Dummy Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Recent Logs
            </h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto">
              <p>[10:42:01] System booted successfully</p>
              <p>[10:42:05] DB Connection established</p>
              <p>[10:45:12] User authentication successful (Admin)</p>
              <p className="text-yellow-400">
                [10:48:33] Warning: High memory usage detected in container 2
              </p>
              <p>[10:50:00] CRON job executed</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
