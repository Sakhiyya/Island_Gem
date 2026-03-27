import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/Login.css";

const GOOGLE_AUTH_URL  = `${process.env.REACT_APP_API_URL}/auth/google`;
const FACEBOOK_AUTH_URL = `${process.env.REACT_APP_API_URL}/auth/facebook`;

function TouristLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Show success message after registration
  const registered = new URLSearchParams(location.search).get("registered");
  const oauthError  = new URLSearchParams(location.search).get("error");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tourist/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      login({
        id:          data.user.id,
        email:       data.user.email || data.user.Email,
        username:    data.user.username,
        first_name:  data.user.first_name,
        last_name:   data.user.last_name,
        nationality: data.user.nationality,
        avatar_url:  data.user.avatar_url,
        role:        "tourist",
      });
      navigate("/");
    } catch {
      setError("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">🏝️</div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your Island Gems account</p>

        {registered && (
          <div className="auth-success">
            Account created! You can now sign in.
          </div>
        )}
        {oauthError && (
          <div className="auth-error">
            {oauthError === "google" ? "Google sign-in failed." : oauthError === "facebook" ? "Facebook sign-in failed." : "Sign-in failed."} Please try again.
          </div>
        )}
        {error && <div className="auth-error">{error}</div>}

        {/* ── SOCIAL BUTTONS ───────────────────────────── */}
        <div className="auth-social-btns">
          <a href={GOOGLE_AUTH_URL} className="auth-social-btn auth-google-btn">
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.16 2.86l6.08-6.08C34.36 3.24 29.43 1 24 1 14.72 1 6.91 6.6 3.42 14.6l7.07 5.49C12.2 13.6 17.63 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.98-2.21 5.5-4.71 7.19l7.2 5.6C43.27 37.4 46.5 31.4 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.49 28.09A14.5 14.5 0 0 1 9.5 24c0-1.42.2-2.8.56-4.09L2.99 14.42A23.47 23.47 0 0 0 .5 24c0 3.78.9 7.36 2.49 10.54l7.5-6.45z"/>
              <path fill="#34A853" d="M24 47c5.43 0 10-1.79 13.33-4.87l-7.2-5.6C28.23 38.14 26.2 39 24 39c-6.37 0-11.8-4.1-13.51-9.91l-7.07 5.49C6.91 42.4 14.72 48 24 48z"/>
            </svg>
            Continue with Google
          </a>

          <a href={FACEBOOK_AUTH_URL} className="auth-social-btn auth-facebook-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginRight: 10 }}>
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Continue with Facebook
          </a>
        </div>

        <div className="auth-divider"><span>or sign in with email</span></div>

        {/* ── EMAIL FORM ───────────────────────────────── */}
        <form onSubmit={handleLogin}>
          <div className="auth-fields">
            <div className="auth-field">
              <label>Email address</label>
              <input
                type="email" placeholder="you@example.com" required
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password" placeholder="••••••••" required
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-link">
          Don't have an account? <Link to="/tourist-register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default TouristLogin;
