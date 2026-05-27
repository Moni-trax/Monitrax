import Sidebar from "../components/Sidebar";
import { Play, Square, RefreshCw, Box } from "lucide-react";

export default function Containers() {
  // Dummy data for Phase 1
  const containers = [
    {
      id: "a1b2c3d4",
      name: "api-server",
      status: "running",
      image: "node:18-alpine",
      port: "5000",
    },
    {
      id: "e5f6g7h8",
      name: "frontend-app",
      status: "running",
      image: "nginx:latest",
      port: "80",
    },
    {
      id: "i9j0k1l2",
      name: "redis-cache",
      status: "stopped",
      image: "redis:alpine",
      port: "6379",
    },
    {
      id: "m3n4o5p6",
      name: "postgres-db",
      status: "running",
      image: "postgres:15",
      port: "5432",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Docker Containers
          </h1>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Container Name</th>
                <th className="p-4 font-medium">Image</th>
                <th className="p-4 font-medium">Port</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {containers.map((container) => (
                <tr key={container.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 flex items-center space-x-3">
                    <Box size={20} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-800">
                        {container.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {container.id}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {container.image}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {container.port}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        container.status === "running"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {container.status.charAt(0).toUpperCase() +
                        container.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {container.status === "running" ? (
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Stop"
                      >
                        <Square size={18} />
                      </button>
                    ) : (
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Start"
                      >
                        <Play size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
