import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL;

const LEVEL_COLORS = {
  error:   { bg: "#ef444420", text: "#ef4444" },
  warning: { bg: "#f59e0b20", text: "#f59e0b" },
  info:    { bg: "#00acc120", text: "#00acc1" },
};

const CATEGORIES = ["api", "database", "scraping", "auth", "system"];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
}

export default function AdminLogs() {
  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [level,    setLevel]    = useState("");
  const [category, setCategory] = useState("");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page });
    if (level)    params.set("level",    level);
    if (category) params.set("category", category);
    if (search)   params.set("search",   search);
    try {
      const r    = await fetch(`${API}/api/admin/logs?${params}`, { headers: authHeaders() });
      const data = await r.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, level, category, search]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  const applyFilter = (fn) => { fn(); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">System Logs</h1>
          <p className="ap-page-sub">API errors, database events, scraping results, and auth activity</p>
        </div>
        <button className="ap-btn-secondary" onClick={load}>Refresh</button>
      </div>

      {/* Filters */}
      <div className="ap-log-filters">
        {/* Level filter */}
        <div className="ap-filter-group">
          {["", "info", "warning", "error"].map(l => (
            <button
              key={l}
              className={"ap-filter-btn" + (level === l ? " active" : "")}
              style={level === l && l ? { background: LEVEL_COLORS[l]?.bg, color: LEVEL_COLORS[l]?.text, borderColor: LEVEL_COLORS[l]?.text } : {}}
              onClick={() => applyFilter(() => setLevel(l))}
            >
              {l === "" ? "All Levels" : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        {/* Category select */}
        <select
          className="ap-select"
          value={category}
          onChange={e => applyFilter(() => setCategory(e.target.value))}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        {/* Search */}
        <div className="ap-search-bar ap-search-bar--inline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="ap-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="ap-search-input"
            placeholder="Search message…"
            value={search}
            onChange={e => applyFilter(() => setSearch(e.target.value))}
          />
          {search && <button className="ap-search-clear" onClick={() => applyFilter(() => setSearch(""))}>✕</button>}
        </div>

        <span className="ap-count-badge">{total} entries</span>
      </div>

      <div className="ap-card">
        {loading ? (
          <div className="ap-page-loading">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="ap-empty">No log entries found. Logs are written automatically when API errors or auth events occur.</div>
        ) : (
          <table className="ap-table ap-logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Category</th>
                <th>Message</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const colors = LEVEL_COLORS[log.level] || { bg: "#94a3b820", text: "#94a3b8" };
                return (
                  <tr key={log.id}>
                    <td className="ap-td-muted ap-td-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="ap-badge" style={{ background: colors.bg, color: colors.text }}>
                        {log.level}
                      </span>
                    </td>
                    <td>
                      <span className="ap-category-badge">{log.category}</span>
                    </td>
                    <td className="ap-log-message">{log.message}</td>
                    <td>
                      {log.detail ? (
                        <button
                          className="ap-detail-btn"
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        >
                          {expanded === log.id ? "Hide" : "Show"}
                        </button>
                      ) : <span className="ap-td-muted">—</span>}
                      {expanded === log.id && (
                        <pre className="ap-detail-pre">
                          {typeof log.detail === "string"
                            ? log.detail
                            : JSON.stringify(log.detail, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ap-pagination">
          <button className="ap-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span className="ap-page-indicator">Page {page} of {totalPages}</span>
          <button className="ap-btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
