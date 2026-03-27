import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("authorityUser");
    if (!stored) { navigate("/authority-login"); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("authorityToken");
    if (token) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/authority/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("authorityToken");
    localStorage.removeItem("authorityUser");
    navigate("/authority-login");
  };

  if (!user) return null;

  const overviewItems = [
    { icon: "🏨", label: "Hotels & Resorts",    desc: "All accommodation across Mauritius" },
    { icon: "🍽️", label: "Restaurants",          desc: "Dining and hospitality venues" },
    { icon: "🏖️", label: "Beaches & Attractions", desc: "Natural and cultural attractions" },
    { icon: "📊", label: "Review Analytics",      desc: "Sentiment trends across all categories" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#00acc1", fontSize: 20, fontWeight: 800 }}>◆</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>Island Gems</span>
          <span style={{ color: "#e2e8f0", margin: "0 8px" }}>|</span>
          <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Tourism Authority Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{user.name}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Tourism Authority</div>
          </div>
          <div style={{ background: "#8b5cf620", border: "1px solid #8b5cf640", borderRadius: 999, padding: "3px 12px" }}>
            <span style={{ color: "#8b5cf6", fontSize: "0.75rem", fontWeight: 700 }}>READ-ONLY ACCESS</span>
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

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#0f172a", fontSize: "1.7rem", fontWeight: 800, margin: "0 0 6px" }}>
            National Tourism Overview
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Full read-only access to all hotels and attractions across Mauritius.
          </p>
        </div>

        {/* Access scope cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {overviewItems.map(item => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Power BI placeholder */}
        <div style={{ background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0", padding: "80px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📊</div>
          <h2 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 12 }}>National Analytics Dashboard</h2>
          <p style={{ color: "#64748b", maxWidth: 500, margin: "0 auto 24px", lineHeight: 1.6 }}>
            The full Power BI dashboard will appear here once connected. You will have read-only access to sentiment data, trends, and performance metrics for all properties across Mauritius.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#8b5cf620", border: "1px solid #8b5cf640", borderRadius: 999, padding: "8px 20px" }}>
            <span style={{ color: "#8b5cf6", fontSize: "0.85rem", fontWeight: 600 }}>🏛️ Full national access — all properties</span>
          </div>
        </div>

      </div>
    </div>
  );
}
