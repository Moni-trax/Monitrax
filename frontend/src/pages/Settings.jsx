import Sidebar from "../components/Sidebar";

export default function Settings() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

        <div className="max-w-3xl space-y-6">
          {/* Profile Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Account Information
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="admin@cloudmon.com"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your email.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              System Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Email Alerts</h3>
                  <p className="text-sm text-gray-500">
                    Receive notifications when CPU exceeds 90%.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  defaultChecked
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Dark Mode</h3>
                  <p className="text-sm text-gray-500">
                    Toggle dark mode interface (Coming Soon).
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
