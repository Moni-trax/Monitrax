export default function ConnectionStatus({ status }) {
  const labelMap = {
    live: "Live",
    connecting: "Connecting",
    disconnected: "Disconnected",
  };

  return (
    <div className={`status-badge status-${status}`}>
      <span className="status-dot" />
      <span>{labelMap[status] || status}</span>
    </div>
  );
}
