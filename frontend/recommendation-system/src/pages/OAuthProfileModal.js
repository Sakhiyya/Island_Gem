import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
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

function OAuthProfileModal({ user, onComplete }) {
  const { login } = useAuth();
  const [nationality, setNationality] = useState("");
  const [dob, setDob]                 = useState("");
  const [interests, setInterests]     = useState([]);
  const [loading, setLoading]         = useState(false);

  const toggleInterest = (i) =>
    setInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/tourist/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          nationality:    nationality || null,
          date_of_birth:  dob || null,
          travel_interests: interests,
        }),
      });
      // Update stored user with the new info
      login({ ...user, nationality, travel_interests: interests.join(",") });
    } catch {
      // Silently continue — not critical
    }
    setLoading(false);
    onComplete();
  };

  return (
    <div className="oauth-modal-overlay">
      <div className="oauth-modal">

        <div className="auth-logo">🏝️</div>
        <h2 className="auth-title">One last step!</h2>
        <p className="auth-subtitle">
          Help us personalise your Mauritius experience.<br />
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>All fields are optional.</span>
        </p>

        <div className="auth-fields">

          {/* Nationality */}
          <div className="auth-field">
            <label>Where are you from?</label>
            <select value={nationality} onChange={e => setNationality(e.target.value)}>
              <option value="">Select your country</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Date of birth */}
          <div className="auth-field">
            <label>Date of birth</label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
          </div>

          {/* Travel interests */}
          <div className="auth-field">
            <label>Travel interests</label>
            <div className="auth-interests-grid">
              {TRAVEL_INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  className={`auth-interest-btn ${interests.includes(interest) ? "selected" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="auth-nav-btns" style={{ marginTop: 24 }}>
          <button className="auth-btn-secondary" onClick={onComplete}>
            Skip for now
          </button>
          <button className="auth-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save & Continue →"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default OAuthProfileModal;
