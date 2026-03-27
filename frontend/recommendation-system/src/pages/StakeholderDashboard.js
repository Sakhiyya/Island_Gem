import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StakeholderDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("stakeholderUser");
    if (!stored) { navigate("/stakeholder-login"); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("stakeholderToken");
    if (token) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/stakeholder/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("stakeholderToken");
    localStorage.removeItem("stakeholderUser");
    navigate("/stakeholder-login");
  };

  if (!user) return null;

  const roleLabel = { manager: "General Manager", owner: "Owner", group_manager: "Group Manager" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#00acc1", fontSize: 20, fontWeight: 800 }}>◆</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>Island Gems</span>
          <span style={{ color: "#e2e8f0", margin: "0 8px" }}>|</span>
          <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Partner Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{user.name}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{roleLabel[user.role] || user.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: "0.83rem", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#0f172a", fontSize: "1.7rem", fontWeight: 800, margin: "0 0 6px" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            {user.hotels?.length === 1
              ? `Viewing analytics for ${user.hotels[0]}`
              : `You have access to ${user.hotels?.length || 0} properties`}
          </p>
        </div>

        {/* Hotel access cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
          {(user.hotels || []).map(hotel => (
            <div key={hotel} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>🏨</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{hotel}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#00acc120", borderRadius: 999, padding: "3px 10px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00acc1", display: "inline-block" }}></span>
                <span style={{ color: "#00acc1", fontSize: "0.75rem", fontWeight: 600 }}>Access Granted</span>
              </div>
            </div>
          ))}
        </div>

        {/* Power BI Dashboard */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "48px 40px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
          <h2 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 10 }}>Your Analytics Dashboard</h2>

          {user.powerbi_url ? (
            <>
              <p style={{ color: "#64748b", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
                Your personalised hotel analytics report is ready. Click below to open it — you may be asked to sign in with your work email ({user.email}).
              </p>
              <a
                href={user.powerbi_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "#00acc1", color: "#fff", borderRadius: 10,
                  padding: "14px 32px", fontWeight: 700, fontSize: "1rem",
                  textDecoration: "none", boxShadow: "0 4px 12px rgba(0,172,193,0.3)",
                }}
              >
                <span style={{ fontSize: 20 }}>↗</span> Open Power BI Dashboard
              </a>
              <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 20 }}>
                Opens in a new tab · Restricted to your assigned properties
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 12 }}>
                {(user.hotels || []).map(h => (
                  <span key={h} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", borderRadius: 999, padding: "5px 14px", fontSize: "0.82rem", fontWeight: 600 }}>
                    {h}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ color: "#64748b", maxWidth: 480, margin: "0 auto 16px", lineHeight: 1.6 }}>
                Your analytics dashboard is being prepared. The Island Gems team will share it with you shortly — you will receive access via your registered email address.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "8px 20px", color: "#94a3b8", fontSize: "0.85rem" }}>
                <span>⏳</span> Awaiting dashboard link from admin
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
