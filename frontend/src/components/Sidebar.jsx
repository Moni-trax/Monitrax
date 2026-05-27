import { Link, useLocation } from "react-router-dom";
import { Server, Activity, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  // Helper to highlight the active tab
  const isActive = (path) =>
    location.pathname === path
      ? "bg-gray-800 text-blue-400"
      : "hover:bg-gray-800 text-white";

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-700">
        CloudMon
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/dashboard"
          className={`flex items-center space-x-3 p-3 rounded transition ${isActive("/dashboard")}`}
        >
          <Activity size={20} /> <span>Dashboard</span>
        </Link>
        <Link
          to="/containers"
          className={`flex items-center space-x-3 p-3 rounded transition ${isActive("/containers")}`}
        >
          <Server size={20} /> <span>Containers</span>
        </Link>
        <Link
          to="/settings"
          className={`flex items-center space-x-3 p-3 rounded transition ${isActive("/settings")}`}
        >
          <Settings size={20} /> <span>Settings</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-gray-800 rounded transition"
        >
          <LogOut size={20} /> <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
