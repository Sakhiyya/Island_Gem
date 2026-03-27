import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";

const TRAVEL_INTERESTS = [
  "Beach", "Nature", "Adventure", "Culture",
  "Food & Cuisine", "History", "Luxury", "Budget Travel",
  "Water Sports", "Wildlife",
];

const NATIONALITIES = [
  "French", "British", "German", "Italian", "Spanish",
  "American", "Australian", "South African", "Indian",
  "Chinese", "Japanese", "Mauritian", "Reunionese",
  "Swiss", "Belgian", "Dutch", "Canadian", "Brazilian",
  "Russian", "Swedish", "Other",
];

const STEPS = ["Account", "Personal", "Preferences"];

function TouristRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    password: "", confirm_password: "",
    nationality: "", date_of_birth: "", phone: "",
    travel_interests: [],
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleInterest = (interest) => {
    setForm(f => ({
      ...f,
      travel_interests: f.travel_interests.includes(interest)
        ? f.travel_interests.filter(i => i !== interest)
        : [...f.travel_interests, interest],
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.first_name.trim() || !form.last_name.trim())
        return "Please enter your first and last name.";
      if (!form.email.trim()) return "Email is required.";
      if (!form.password) return "Password is required.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirm_password) return "Passwords do not match.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tourist/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `${form.first_name.trim()} ${form.last_name.trim()}`,
          email: form.email,
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          nationality: form.nationality || null,
          date_of_birth: form.date_of_birth || null,
          phone: form.phone || null,
          travel_interests: form.travel_interests,
        }),
      });

      const data = await response.json();
      if (!response.ok) { setError(data.message); setLoading(false); return; }

      navigate("/tourist-login?registered=1");
    } catch {
      setError("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">

        {/* Header */}
        <div className="auth-logo">🏝️</div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join Island Gems and discover Mauritius</p>

        {/* Step indicator */}
        <div className="auth-steps">
          {STEPS.map((label, i) => (
            <div key={i} className={`auth-step ${i === step ? "active" : i < step ? "done" : ""}`}>
              <div className="auth-step-dot">{i < step ? "✓" : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); next(); }}>

          {/* ── STEP 0: Account ─────────────────────────── */}
          {step === 0 && (
            <div className="auth-fields">
              <div className="auth-row">
                <div className="auth-field">
                  <label>First name *</label>
                  <input
                    type="text" placeholder="Marie" required
                    value={form.first_name} onChange={e => set("first_name", e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Last name *</label>
                  <input
                    type="text" placeholder="Dupont" required
                    value={form.last_name} onChange={e => set("last_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Email address *</label>
                <input
                  type="email" placeholder="you@example.com" required
                  value={form.email} onChange={e => set("email", e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label>Password * <span className="auth-hint">(min. 8 characters)</span></label>
                <input
                  type="password" placeholder="••••••••" required
                  value={form.password} onChange={e => set("password", e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label>Confirm password *</label>
                <input
                  type="password" placeholder="••••••••" required
                  value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Personal ────────────────────────── */}
          {step === 1 && (
            <div className="auth-fields">
              <div className="auth-field">
                <label>Nationality</label>
                <select value={form.nationality} onChange={e => set("nationality", e.target.value)}>
                  <option value="">Select your country</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label>Date of birth</label>
                  <input
                    type="date" max={new Date().toISOString().split("T")[0]}
                    value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Phone number</label>
                  <input
                    type="tel" placeholder="+230 5XXX XXXX"
                    value={form.phone} onChange={e => set("phone", e.target.value)}
                  />
                </div>
              </div>
              <p className="auth-hint-block">All personal details are optional and used only to improve your recommendations.</p>
            </div>
          )}

          {/* ── STEP 2: Preferences ─────────────────────── */}
          {step === 2 && (
            <div className="auth-fields">
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 12 }}>
                What kind of experiences are you looking for? <em>(optional)</em>
              </p>
              <div className="auth-interests-grid">
                {TRAVEL_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`auth-interest-btn ${form.travel_interests.includes(interest) ? "selected" : ""}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="auth-nav-btns">
            {step > 0 && (
              <button type="button" className="auth-btn-secondary" onClick={() => { setError(""); setStep(s => s - 1); }}>
                ← Back
              </button>
            )}
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {step < 2 ? "Continue →" : loading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        </form>

        <p className="auth-footer-link">
          Already have an account? <Link to="/tourist-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default TouristRegister;
