export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-2 text-3xl font-bold text-gray-800">{value}</div>
      {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}
