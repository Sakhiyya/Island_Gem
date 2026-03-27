import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/Admin.css";

function AdminLogin() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); setLoading(false); return; }

      localStorage.setItem("adminToken", data.token);
      login({ id: data.user.id, email: data.user.email, role: "admin", username: data.user.username });
      navigate("/admin");
    } catch {
      setError("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="al-page">
      {/* Left panel */}
      <div className="al-left">
        <div className="al-left-content">
          <div className="al-brand">
            <span className="al-brand-gem">◆</span>
            <span className="al-brand-name">Island Gems</span>
          </div>
          <h1 className="al-hero-title">Admin Portal</h1>
          <p className="al-hero-sub">
            Monitor system health, manage users, and review logs from one central dashboard.
          </p>
          <div className="al-features">
            <div className="al-feature-item">
              <span className="al-feature-dot" />
              System health &amp; scraping pipeline status
            </div>
            <div className="al-feature-item">
              <span className="al-feature-dot" />
              Tourist account management
            </div>
            <div className="al-feature-item">
              <span className="al-feature-dot" />
              API errors, DB events &amp; audit logs
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="al-right">
        <div className="al-form-card">
          <div className="al-form-header">
            <div className="al-shield-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="al-form-title">Sign in to Admin</h2>
            <p className="al-form-sub">Authorized personnel only</p>
          </div>

          {error && <div className="al-error">{error}</div>}

          <form onSubmit={handleLogin} className="al-form">
            <div className="al-field">
              <label className="al-label">Email address</label>
              <input
                className="al-input"
                type="email"
                placeholder="admin@islandgems.mu"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="al-field">
              <label className="al-label">Password</label>
              <div className="al-pass-wrap">
                <input
                  className="al-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="al-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="al-submit-btn" disabled={loading}>
              {loading ? (
                <span className="al-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Sign In to Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="al-secure-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Encrypted &amp; monitored session
          </div>

          <Link to="/login-selection" className="al-back-link">← Back to Login Selection</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
