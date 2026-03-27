import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import "../App.css";
import { useAuth } from "../auth/AuthContext";
import { FaUser } from "react-icons/fa";
import { FaGem } from "react-icons/fa";



function Header({ active }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [openLang, setOpenLang] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);



  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // WCAG 2.1 — keep <html lang> in sync with the selected language
    document.documentElement.lang = lng;
  };

  // Get base language (en from en-US)
  const currentLang = i18n.language.split("-")[0];

  // Modern language structure
  const languages = [
    { code: "en", native: "English", english: "English" },
    { code: "fr", native: "Français", english: "French" },
    { code: "es", native: "Español", english: "Spanish" },
    { code: "de", native: "Deutsch", english: "German" },
    { code: "zh", native: "中文", english: "Chinese" },
    { code: "hi", native: "हिन्दी", english: "Hindi" },
  ];

  return (
    <header className="header">

      {/* LOGO */}
    <Link to="/" className="logo" style={{ textDecoration: "none" }}>
      <FaGem style={{ color: "#FFD166", fontSize: "1.6rem", marginRight: "8px" }} />
      <span className="logo-text">
        <span style={{ color: "#0f172a", fontWeight: 700 }}>Island </span>
        <span style={{ color: "#FFD166", fontWeight: 700 }}>Gems</span>
      </span>
    </Link>

      {/* NAV LINKS */}
      <nav className={menuOpen ? "nav-open" : ""}>
        <Link className={active === "home" ? "active" : ""} to="/">
          {t("nav.home")}
        </Link>

        <Link className={active === "explore" ? "active" : ""} to="/explore">
          {t("nav.explore")}
        </Link>

        <Link className={active === "itinerary" ? "active" : ""} to="/plan-trip">
          {t("nav.planTrip")}
        </Link>

        <Link className={active === "tourist" ? "active" : ""} to="/tourist-dashboard">
          {t("nav.touristHub")}
        </Link>
      </nav>

      {/* 🌍 LANGUAGE SWITCHER */}
      <div className="language-switcher">

        <button
          className="globe-btn"
          onClick={() => setOpenLang(!openLang)}
        >
          <FaGlobe />
        </button>

        {openLang && (
          <div className="language-dropdown modern">

            <div className="dropdown-title">
              {t("nav.language") || "Language"}
            </div>

            <div className="language-grid">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`language-card ${
                    currentLang === lang.code ? "active" : ""
                  }`}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setOpenLang(false);
                  }}
                >
                  <span className="native">{lang.native}</span>
                  <span className="english">{lang.english}</span>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
      
      {/* USER / LOGIN BUTTON */}
<div className="user-section">
  {user ? (
    <div className="user-menu">
      <span className="user-greeting">Hi, {user.first_name || user.username}</span>
      <Link className="my-itineraries-btn" to="/my-itineraries">My Itineraries</Link>
      <button
        className="logout-btn"
        onClick={() => { logout(); navigate("/"); }}
      >
        Logout
      </button>
    </div>
  ) : (
    <button
      className="signin-btn"
      onClick={() => navigate("/login-selection")}
    >
      <FaUser style={{ marginRight: "6px" }} />
      Sign In
    </button>
  )}
</div>

  {/* HAMBURGER BUTTON - mobile only */}
  <button
    className="hamburger-btn"
    onClick={() => setMenuOpen(!menuOpen)}
    aria-label="Toggle menu"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>


    </header>
  );
}

export default Header;