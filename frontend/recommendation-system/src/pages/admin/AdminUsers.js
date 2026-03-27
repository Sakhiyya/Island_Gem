import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL;

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: "delete"|"disable", user }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/users`, { headers: authHeaders() });
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email    || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleDisable = async (user) => {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ disabled: !user.disabled }),
    });
    setConfirm(null);
    load();
  };

  const deleteUser = async (user) => {
    await fetch(`${API}/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setConfirm(null);
    load();
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">User Management</h1>
          <p className="ap-page-sub">View, disable, or remove tourist accounts</p>
        </div>
        <div className="ap-page-header-right">
          <span className="ap-count-badge">{users.length} total users</span>
        </div>
      </div>

      {/* Search */}
      <div className="ap-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="ap-search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="ap-search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="ap-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      <div className="ap-card">
        {loading ? (
          <div className="ap-page-loading">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">{search ? "No users match your search." : "No tourist accounts yet."}</div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Nationality</th>
                <th>Auth</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={u.disabled ? "ap-row-disabled" : ""}>
                  <td className="ap-td-muted">{u.id}</td>
                  <td>
                    <div className="ap-user-cell">
                      <div className="ap-user-cell-avatar">
                        {(u.first_name || u.username || "?")[0].toUpperCase()}
                      </div>
                      <span>{u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || "—"}</span>
                    </div>
                  </td>
                  <td className="ap-td-muted">{u.email}</td>
                  <td className="ap-td-muted">{u.nationality || "—"}</td>
                  <td>
                    <span className="ap-auth-badge">
                      {u.oauth_provider === "google" ? "🔵 Google" : u.oauth_provider === "facebook" ? "🔷 Facebook" : "✉️ Email"}
                    </span>
                  </td>
                  <td className="ap-td-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {u.disabled
                      ? <span className="ap-badge" style={{ background: "#ef444420", color: "#ef4444" }}>Disabled</span>
                      : <span className="ap-badge" style={{ background: "#10b98120", color: "#10b981" }}>Active</span>
                    }
                  </td>
                  <td>
                    <div className="ap-action-btns">
                      <button
                        className={u.disabled ? "ap-btn-enable" : "ap-btn-disable"}
                        onClick={() => setConfirm({ type: "disable", user: u })}
                      >
                        {u.disabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        className="ap-btn-delete"
                        onClick={() => setConfirm({ type: "delete", user: u })}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="ap-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3 className="ap-modal-title">
              {confirm.type === "delete" ? "Delete User" : confirm.user.disabled ? "Enable User" : "Disable User"}
            </h3>
            <p className="ap-modal-body">
              {confirm.type === "delete"
                ? `Permanently delete ${confirm.user.email}? This cannot be undone.`
                : confirm.user.disabled
                  ? `Re-enable ${confirm.user.email}? They will be able to log in again.`
                  : `Disable ${confirm.user.email}? They will not be able to log in.`
              }
            </p>
            <div className="ap-modal-actions">
              <button className="ap-btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className={confirm.type === "delete" ? "ap-btn-delete" : "ap-btn-disable"}
                onClick={() => confirm.type === "delete" ? deleteUser(confirm.user) : toggleDisable(confirm.user)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
