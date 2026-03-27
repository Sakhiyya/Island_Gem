import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

export default function AuthorityLogin() {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r    = await fetch(`${API}/api/authority/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) return setError(data.message || "Login failed.");
      localStorage.setItem("authorityToken", data.token);
      localStorage.setItem("authorityUser",  JSON.stringify(data.user));
      navigate("/authority-dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 48px" }}>
        <div style={{ maxWidth: 400, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <span style={{ color: "#00acc1", fontSize: 22 }}>◆</span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Island Gems</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 999, padding: "5px 14px", marginBottom: 24 }}>
            <span style={{ fontSize: 14 }}>🏛️</span>
            <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>TOURISM AUTHORITY</span>
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
            National tourism analytics, all in one place
          </h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
            Full read-only access to all hotel and attraction analytics across Mauritius. Monitor national tourism performance in real time.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "60px 48px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <button onClick={() => navigate("/login-selection")} style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", cursor: "pointer", marginBottom: 32, padding: 0 }}>
            ← Back to login selection
          </button>

          <h1 style={{ color: "#0f172a", fontSize: "1.7rem", fontWeight: 800, marginBottom: 6 }}>Authority Sign In</h1>
          <p style={{ color: "#64748b", marginBottom: 32, fontSize: "0.95rem" }}>Sign in to your Tourism Authority account.</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: "0.9rem", marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@mtpa.mu"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ background: loading ? "#94a3b8" : "#8b5cf6", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", marginTop: 28 }}>
            Authority accounts are created by the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
