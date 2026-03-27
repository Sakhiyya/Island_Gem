import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "../../styles/Admin.css";

const API = process.env.REACT_APP_API_URL;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        await fetch(`${API}/api/admin/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {}
      localStorage.removeItem("adminToken");
    }
    logout();
    navigate("/login-selection");
  };

  const initials = (user?.username || "A").slice(0, 1).toUpperCase();

  return (
    <div className="ap-shell">
      {/* ── Sidebar ── */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar-brand">
          <span className="ap-brand-gem">◆</span>
          <span className="ap-brand-name">Island Gems</span>
        </div>
        <div className="ap-sidebar-section-label">ADMINISTRATION</div>

        <nav className="ap-nav">
          <NavLink to="/admin" end className={({ isActive }) => "ap-nav-item" + (isActive ? " active" : "")}>
            <svg className="ap-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            System Health
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => "ap-nav-item" + (isActive ? " active" : "")}>
            <svg className="ap-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            User Management
          </NavLink>
          <NavLink to="/admin/stakeholders" className={({ isActive }) => "ap-nav-item" + (isActive ? " active" : "")}>
            <svg className="ap-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Stakeholders
          </NavLink>
          <NavLink to="/admin/logs" className={({ isActive }) => "ap-nav-item" + (isActive ? " active" : "")}>
            <svg className="ap-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            System Logs
          </NavLink>
        </nav>

        <div className="ap-sidebar-footer">
          <div className="ap-user-info">
            <div className="ap-avatar">{initials}</div>
            <div className="ap-user-text">
              <div className="ap-user-name">{user?.username || "Admin"}</div>
              <div className="ap-user-role">Administrator</div>
            </div>
          </div>
          <button className="ap-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ap-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
