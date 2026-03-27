import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

export default function StakeholderRegister() {
  const navigate = useNavigate();
  const [hotels,    setHotels]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    name:       "",
    email:      "",
    phone:      "",
    role:       "manager",
    hotel_name: "",
    message:    "",
  });

  useEffect(() => {
    fetch(`${API}/api/hotels`)
      .then(r => r.json())
      .then(data => setHotels(Array.isArray(data) ? data : []))
      .catch(() => setHotels([]));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.hotel_name)
      return setError("Name, email and hotel name are required.");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/stakeholder/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) return setError(data.message || "Submission failed.");
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none",
    fontFamily: "inherit", background: "#fff", color: "#0f172a",
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "60px 48px", maxWidth: 480, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 56, marginBottom: 20, color: "#00acc1" }}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <h2 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 12 }}>Request Submitted!</h2>
          <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: 32 }}>
            Thank you! We'll review your request and send your login credentials to <strong>{form.email}</strong> within 24 hours.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{ background: "#00acc1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #00acc1 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 48px" }}>
        <div style={{ maxWidth: 400, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <span style={{ color: "#00acc1", fontSize: 22 }}>◆</span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Island Gems</span>
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.3, marginBottom: 20 }}>
            Join hundreds of hotel managers already using Island Gems
          </h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: 40 }}>
            Get free access to your guests' real sentiment data, aspect-level breakdowns, and trend analytics — all in one dashboard.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "bi-bar-chart-fill",    label: "Sentiment analytics per hotel" },
              { icon: "bi-trophy-fill",        label: "Competitor benchmarking" },
              { icon: "bi-graph-up-arrow",     label: "Monthly trend reports" },
              { icon: "bi-shield-lock-fill",   label: "Secure, role-based access" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, color: "#cbd5e1", fontSize: "0.9rem" }}>
                <i className={`bi ${item.icon}`} style={{ fontSize: "1.1rem", color: "#00acc1", flexShrink: 0 }}></i>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "60px 48px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <button
            onClick={() => navigate("/partners")}
            style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", cursor: "pointer", marginBottom: 32, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>

          <h1 style={{ color: "#0f172a", fontSize: "1.7rem", fontWeight: 800, marginBottom: 6 }}>Request Partner Access</h1>
          <p style={{ color: "#64748b", marginBottom: 32, fontSize: "0.95rem" }}>Fill in your details and we'll get back to you within 24 hours.</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: "0.9rem", marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Jean-Pierre Morel" style={field} required />
            </div>

            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Work Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@hotel.com" style={field} required />
            </div>

            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+230 5xxx xxxx" style={field} />
            </div>

            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Your Role *</label>
              <select name="role" value={form.role} onChange={handleChange} style={field}>
                <option value="manager">General Manager</option>
                <option value="owner">Owner</option>
                <option value="group_manager">Group Manager</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Hotel / Property *</label>
              <select name="hotel_name" value={form.hotel_name} onChange={handleChange} style={field} required>
                <option value="">Select your hotel…</option>
                {hotels.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Why do you want access? (optional)</label>
              <textarea
                name="message" value={form.message} onChange={handleChange}
                placeholder="Tell us a bit about how you plan to use the platform…"
                rows={3}
                style={{ ...field, resize: "vertical" }}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{ background: loading ? "#94a3b8" : "#00acc1", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}
            >
              {loading ? "Submitting…" : "Submit Request →"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", marginTop: 24 }}>
            Already have an account?{" "}
            <span onClick={() => navigate("/stakeholder-login")} style={{ color: "#00acc1", cursor: "pointer", fontWeight: 600 }}>
              Sign in here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
