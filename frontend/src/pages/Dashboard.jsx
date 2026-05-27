import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { Globe, Trash2, Activity, Clock } from "lucide-react";

export default function Dashboard() {
  const [targets, setTargets] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "website",
  });
  const [loading, setLoading] = useState(false);

  // Helper to get auth token
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:6225/api/targets", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
      }
    } catch (error) {
      console.error("Failed to fetch targets:", error);
    }
  }, []);

  // Initial fetch and Setup Polling
  useEffect(() => {
    fetchTargets();
    // Poll the backend every 5 seconds for fresh data
    const interval = setInterval(fetchTargets, 5000);
    return () => clearInterval(interval);
  }, [fetchTargets]);

  const handleAddTarget = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:6225/api/targets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: "", url: "", type: "website" });
        fetchTargets(); // Instantly refresh table
      }
    } catch (error) {
      console.error("Failed to add target:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this monitor?"))
      return;
    try {
      await fetch(`http://localhost:6225/api/targets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      fetchTargets();
    } catch (error) {
      console.error("Failed to delete target:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Uptime Monitors
        </h1>

        {/* Add Target Form */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Add New Monitor
          </h2>
          <form
            onSubmit={handleAddTarget}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              type="text"
              placeholder="App Name (e.g., Main API)"
              required
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <input
              type="url"
              placeholder="https://example.com"
              required
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />
            <select
              className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="website">Website</option>
              <option value="api">API Endpoint</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              Add Target
            </button>
          </form>
        </div>

        {/* Targets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Target</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Response Time</th>
                <th className="p-4 font-medium">Last Checked</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {targets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No monitors active. Add a website or API to get started.
                  </td>
                </tr>
              ) : (
                targets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-medium text-gray-800 flex items-center space-x-2">
                        <Globe size={16} className="text-gray-400" />
                        <span>{target.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {target.url}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 uppercase">
                      {target.type}
                    </td>
                    <td className="p-4">
                      {target.status === "online" && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          Online
                        </span>
                      )}
                      {target.status === "offline" && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                          Offline
                        </span>
                      )}
                      {target.status === "pending" && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 flex items-center space-x-2">
                      <Activity size={14} className="text-gray-400" />
                      <span>
                        {target.responseTime
                          ? `${target.responseTime} ms`
                          : "-"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>
                          {target.lastChecked
                            ? new Date(target.lastChecked).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(target.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                        title="Remove Monitor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
