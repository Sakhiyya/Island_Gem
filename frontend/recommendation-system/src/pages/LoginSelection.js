import React from "react";
import { useNavigate } from "react-router-dom";
import wavesVideo from "../assets/1893629-uhd_3840_2160_25fps.mp4";
import "../styles/LoginSelection.css";

function LoginSelection() {
  const navigate = useNavigate();

  const loginOptions = [
    {
      title: "Tourist",
      description: "Explore Mauritius destinations, plan your trip and discover attractions.",
      route: "/tourist-login",
      active: true,
    },
    {
      title: "Admin",
      description: "Full control over the platform and all data.",
      route: "/admin-login",
      active: true,
    },
    {
      title: "Stakeholder",
      description: "View your hotel's Power BI dashboard and analytics.",
      route: "/stakeholder-login",
      active: true,
    },
    {
      title: "Tourism Authority",
      description: "Read-only access to all hotel dashboards and reports.",
      route: "/authority-login",
      active: true,
    },
  ];

  return (
    <div className="login-selection-page">
      <video autoPlay loop muted playsInline className="video-background">
        <source src={wavesVideo} type="video/mp4" />
      </video>

      <div className="video-overlay"></div>

      <div className="login-selection-content">
        <h1 className="login-selection-title">Welcome to Mauritius Tourism</h1>
        <p className="login-selection-subtitle">Select how you want to sign in</p>

        <div className="login-cards-grid">
          {loginOptions.map((option) => (
            <div
              key={option.title}
              className={`login-option-card ${!option.active ? "disabled" : ""}`}
              onClick={() => option.active && navigate(option.route)}
            >
              {!option.active && <span className="coming-soon-badge">Coming Soon</span>}
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              {option.active && (
                <button className="login-option-btn">Sign In as {option.title}</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
