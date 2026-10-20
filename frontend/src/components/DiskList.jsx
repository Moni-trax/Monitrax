import { bytesToGb, formatPercent, getStatusLevel } from "../utils/format";

export default function DiskList({ disks = [] }) {
  return (
    <div className="card disk-card">
      <div className="card-header">
        <h3 className="card-title">Storage Filesystems</h3>
        <span className="card-badge">{disks.length} Mounts</span>
      </div>
      <div className="disk-list">
        {disks.map((d, index) => {
          const level = getStatusLevel(d.usagePercent);
          return (
            <div key={d.mount || index} className="disk-item">
              <div className="disk-meta">
                <span className="disk-mount">{d.mount}</span>
                <span className="disk-storage">
                  {bytesToGb(d.usedBytes)} / {bytesToGb(d.totalBytes)}
                </span>
                <span className={`disk-pct text-${level}`}>
                  {formatPercent(d.usagePercent)}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill bg-${level}`}
                  style={{ width: `${Math.min(d.usagePercent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
