import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL;

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="ap-stat-card">
      <div className="ap-stat-accent" style={{ background: color }} />
      <div className="ap-stat-body">
        <div className="ap-stat-label">{label}</div>
        <div className="ap-stat-value" style={{ color }}>{value}</div>
        {sub && <div className="ap-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { success: ["#10b981", "Success"], failed: ["#ef4444", "Failed"], running: ["#f59e0b", "Running"] };
  const [color, label] = map[status] || ["#94a3b8", status];
  return <span className="ap-badge" style={{ background: color + "20", color }}>{label}</span>;
}

export default function AdminHealth() {
  const [data,    setData]    = useState(null);
  const [dbOk,    setDbOk]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    const h     = { Authorization: `Bearer ${token}` };
    try {
      const [health, ping] = await Promise.all([
        fetch(`${API}/api/admin/health`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/admin/ping`,   { headers: h }).then(r => r.json()).catch(() => ({ ok: false })),
      ]);
      setData(health);
      setDbOk(ping.ok);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="ap-page-loading">Loading system health…</div>;

  const lastTime = data?.last_scrape?.completed_at;

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">System Health</h1>
          <p className="ap-page-sub">Live overview of platform status and data pipeline</p>
        </div>
        <button className="ap-btn-secondary" onClick={load}>Refresh</button>
      </div>

      {/* Stat cards */}
      <div className="ap-stat-grid">
        <StatCard
          label="Last Scrape"
          value={timeAgo(lastTime)}
          sub={lastTime ? new Date(lastTime).toLocaleString() : "No runs recorded"}
          color="#00acc1"
        />
        <StatCard
          label="Total Reviews"
          value={data?.total_reviews?.toLocaleString() ?? "—"}
          sub="Records in sentiment_reviews"
          color="#8b5cf6"
        />
        <StatCard
          label="ABSA Records"
          value={data?.total_absa?.toLocaleString() ?? "—"}
          sub="Records in absa_aspect_mentions"
          color="#f59e0b"
        />
        <StatCard
          label="Errors (24h)"
          value={data?.errors_24h ?? "—"}
          sub="In system logs"
          color={data?.errors_24h > 0 ? "#ef4444" : "#10b981"}
        />
        <StatCard
          label="Database"
          value={dbOk === null ? "Checking…" : dbOk ? "Connected" : "Down"}
          sub="Neon PostgreSQL"
          color={dbOk ? "#10b981" : "#ef4444"}
        />
      </div>

      {/* Recent scraping runs */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">Recent Scraping Runs</h2>
          <span className="ap-card-hint">Last 5 runs</span>
        </div>
        {!data?.recent_runs?.length ? (
          <div className="ap-empty">No scraping runs recorded yet. Runs will appear here once the pipeline is executed.</div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Status</th>
                <th>Records Processed</th>
                <th>Errors</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_runs.map(run => (
                <tr key={run.id}>
                  <td className="ap-td-muted">{run.id}</td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.records_processed?.toLocaleString()}</td>
                  <td style={{ color: run.errors_count > 0 ? "#ef4444" : "inherit" }}>{run.errors_count}</td>
                  <td className="ap-td-muted">{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</td>
                  <td className="ap-td-muted">{run.completed_at ? new Date(run.completed_at).toLocaleString() : "—"}</td>
                  <td className="ap-td-muted">{run.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
