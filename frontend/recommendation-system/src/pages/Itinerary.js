import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import "../App.css";
import "./Itinerary.css";
import wavesVideo from "../assets/1409899-uhd_3840_2160_25fps.mp4";
import {
  FaUser, FaHeart, FaUsers, FaUserFriends, FaBriefcase,
  FaUmbrellaBeach, FaTree, FaLandmark, FaHiking,
  FaUtensils, FaSpa, FaBed, FaTag,
  FaMapMarkerAlt, FaStar, FaBookmark, FaCalendarAlt,
  FaChevronRight, FaArrowLeft, FaCheckCircle,
} from "react-icons/fa";

// ── Config ───────────────────────────────────────────────────────────────────

const TRAVEL_TYPE_CONFIG = {
  solo:     { Icon: FaUser,        label: "Solo",     desc: "Independent exploration" },
  couple:   { Icon: FaHeart,       label: "Couple",   desc: "Romantic getaway" },
  family:   { Icon: FaUsers,       label: "Family",   desc: "Fun for all ages" },
  group:    { Icon: FaUserFriends, label: "Group",    desc: "Travel with friends" },
  business: { Icon: FaBriefcase,   label: "Business", desc: "Work & leisure" },
};

const INTERESTS = [
  { id: "beaches",    label: "Beaches & Ocean",   Icon: FaUmbrellaBeach,
    aspects: ["beach_facilities", "sand_shore", "water_quality", "photo_worthy"] },
  { id: "nature",     label: "Nature & Scenery",  Icon: FaTree,
    aspects: ["nature_scenery", "wildlife", "photo_worthy", "atmosphere"] },
  { id: "culture",    label: "Culture & History", Icon: FaLandmark,
    aspects: ["historical_cultural", "educational_value", "exhibits_collection", "experience_quality"] },
  { id: "adventure",  label: "Adventure",         Icon: FaHiking,
    aspects: ["trails_activities", "equipment_safety", "guide_instructor", "experience"] },
  { id: "food",       label: "Food & Dining",     Icon: FaUtensils,
    aspects: ["food_dining", "food_quality", "dining_experience", "drinks", "menu_variety"] },
  { id: "relaxation", label: "Relaxation & Spa",  Icon: FaSpa,
    aspects: ["atmosphere", "cleanliness", "hotel_amenities", "safety"] },
  { id: "accomm",     label: "Accommodation",     Icon: FaBed,
    aspects: ["room_quality", "cleanliness", "hotel_amenities", "check_in_out"] },
  { id: "value",      label: "Value for Money",   Icon: FaTag,
    aspects: ["value_for_money", "pricing_deals"] },
];

const PRESETS = [3, 5, 7, 10, 14];

// ── Component ────────────────────────────────────────────────────────────────

function Itinerary() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const STEP_LABELS = [t("itinerary.step1"), t("itinerary.step2"), t("itinerary.step3"), t("itinerary.step4")];
  const DAY_SLOTS   = [t("itinerary.slots.morning"), t("itinerary.slots.afternoon"), t("itinerary.slots.evening")];

  const [step,              setStep]              = useState(1);
  const [travelType,        setTravelType]        = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [days,              setDays]              = useState(7);
  const [customDays,        setCustomDays]        = useState("");
  const [useCustom,         setUseCustom]         = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [itinerary,         setItinerary]         = useState(null);
  const [error,             setError]             = useState(null);
  const [travelTypes,       setTravelTypes]       = useState([]);
  const [saveStatus,        setSaveStatus]        = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/travel-types`)
      .then(r => r.json())
      .then(data => setTravelTypes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const toggleInterest = (id) =>
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

  const getAspects = () => {
    const sel = INTERESTS.filter(i => selectedInterests.includes(i.id));
    return [...new Set(sel.flatMap(i => i.aspects))];
  };

  const actualDays = useCustom ? Math.max(1, parseInt(customDays) || 1) : days;

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travel_type: travelType, aspects: getAspects(), days: actualDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setItinerary(data.itinerary);
      setStep(4);
    } catch {
      setError("Could not generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!user) { setSaveStatus("login"); return; }
    setSaveStatus(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/itinerary/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          travel_type: travelType,
          interests: selectedInterests,
          days: actualDays,
          itinerary_data: itinerary,
        }),
      });
      setSaveStatus(res.ok ? "success" : "error");
    } catch {
      setSaveStatus("error");
    }
  };

  const resetAll = () => {
    setStep(1); setTravelType(null); setSelectedInterests([]);
    setDays(7); setCustomDays(""); setUseCustom(false);
    setItinerary(null); setError(null); setSaveStatus(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="plan-trip-page">
      <video autoPlay loop muted playsInline className="video-background">
        <source src={wavesVideo} type="video/mp4" />
      </video>
      <div className="video-overlay" />
      <Header active="planTrip" />

      <main className="content-wrapper">
        <section className={`plan-trip-card step-${step}`}>

          {/* PROGRESS BAR */}
          <div className="progress-container">
            {STEP_LABELS.map((label, i) => {
              const num         = i + 1;
              const isCompleted = step > num;
              const isActive    = step === num;
              return (
                <React.Fragment key={i}>
                  <div className={`step ${isActive ? "active" : ""} ${isCompleted ? "done" : ""}`}>
                    <div className="step-circle">
                      {isCompleted
                        ? <FaCheckCircle style={{ color: "#39d7ec", fontSize: 18 }} />
                        : num}
                    </div>
                    <div className="step-label">{label}</div>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`step-line ${step > num ? "filled" : ""}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── STEP 1: TRAVEL TYPE ── */}
          {step === 1 && (
            <div className="step-animated">
              <h2>{t("itinerary.step1Title")}</h2>
              <p className="step-sub">{t("itinerary.step1Sub")}</p>
              <div className="travel-type-grid">
                {travelTypes.map(type => {
                  const cfg = TRAVEL_TYPE_CONFIG[type] || { Icon: FaUser, label: type, desc: "" };
                  return (
                    <button
                      key={type}
                      className={`travel-type-card ${travelType === type ? "active" : ""}`}
                      onClick={() => setTravelType(type)}
                    >
                      <cfg.Icon className="tt-icon" />
                      <span className="tt-label">{t(`itinerary.travelTypes.${type}.label`)}</span>
                      <span className="tt-desc">{t(`itinerary.travelTypes.${type}.desc`)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="step-btn-wrapper">
                <span />
                <button className="primary-btn" disabled={!travelType} onClick={() => setStep(2)}>
                  {t("itinerary.continue")} <FaChevronRight style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: INTERESTS ── */}
          {step === 2 && (
            <div className="step-animated">
              <h2>{t("itinerary.step2Title")}</h2>
              <p className="step-sub">{t("itinerary.step2Sub")}</p>
              <div className="interests-grid">
                {INTERESTS.map(({ id, Icon }) => (
                  <button
                    key={id}
                    className={`interest-card ${selectedInterests.includes(id) ? "active" : ""}`}
                    onClick={() => toggleInterest(id)}
                  >
                    <Icon className="interest-icon" />
                    <span>{t(`itinerary.interests.${id}`)}</span>
                    {selectedInterests.includes(id) && <span className="check-badge">✓</span>}
                  </button>
                ))}
              </div>
              <div className="step-btn-wrapper">
                <button className="secondary-btn" onClick={() => setStep(1)}>
                  <FaArrowLeft style={{ marginRight: 6 }} /> {t("itinerary.back")}
                </button>
                <button
                  className="primary-btn"
                  disabled={selectedInterests.length === 0}
                  onClick={() => setStep(3)}
                >
                  {t("itinerary.continue")} <FaChevronRight style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: DAYS ── */}
          {step === 3 && (
            <div className="step-animated">
              <h2>{t("itinerary.step3Title")}</h2>
              <p className="step-sub">{t("itinerary.step3Sub")}</p>
              <div className="days-selector">
                {PRESETS.map(d => (
                  <div
                    key={d}
                    className={`day-card ${!useCustom && days === d ? "active" : ""}`}
                    onClick={() => { setDays(d); setUseCustom(false); }}
                  >
                    {d}
                    <span style={{ fontSize: "0.65rem", display: "block", marginTop: 2 }}>days</span>
                  </div>
                ))}
              </div>
              <div className="custom-days-row">
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{t("itinerary.customDays")}</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className={`custom-days-input ${useCustom ? "active" : ""}`}
                  placeholder="e.g. 12"
                  value={customDays}
                  onChange={e => { setCustomDays(e.target.value); setUseCustom(true); }}
                />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{t("itinerary.days")}</span>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="step-btn-wrapper">
                <button className="secondary-btn" onClick={() => setStep(2)}>
                  <FaArrowLeft style={{ marginRight: 6 }} /> {t("itinerary.back")}
                </button>
                <button
                  className="primary-btn"
                  disabled={loading || (useCustom && !customDays)}
                  onClick={generate}
                >
                  {loading ? t("itinerary.generating") : t("itinerary.generateItinerary")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: ITINERARY RESULT ── */}
          {step === 4 && itinerary && (
            <div className="step-animated">
              <div className="itinerary-header">
                <h2>{t("itinerary.planTitle", { days: actualDays })}</h2>
                <p className="step-sub">
                  {travelType && (TRAVEL_TYPE_CONFIG[travelType]?.label || travelType)} travel ·{" "}
                  {selectedInterests
                    .map(id => t(`itinerary.interests.${id}`))
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div className="itinerary-grid">
                {itinerary.map(day => (
                  <div key={day.day} className="itinerary-day">
                    <h3>
                      <FaCalendarAlt style={{ marginRight: 10, color: "#39d7ec" }} />
                      Day {day.day}
                    </h3>
                    {day.attractions.length === 0 ? (
                      <p className="free-day">{t("itinerary.freeDay")}</p>
                    ) : (
                      <ul>
                        {day.attractions.map((att, i) => (
                          <li key={i}>
                            <span className="att-slot">{DAY_SLOTS[i] || "Visit"}</span>
                            <div className="att-details">
                              <span className="att-name">
                                <FaMapMarkerAlt style={{ marginRight: 5, color: "#39d7ec" }} />
                                {att.attraction_name}
                              </span>
                              <span className="att-meta">
                                {att.place_type}&nbsp;·&nbsp;
                                <FaStar style={{ color: "#f59e0b", marginRight: 3 }} />
                                {att.avg_stars}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="itinerary-actions" style={{ marginTop: 40, flexDirection: "column", alignItems: "center", gap: 12 }}>
                {saveStatus === "success" && <p className="save-msg success">{t("itinerary.savedMsg")}</p>}
                {saveStatus === "error"   && <p className="save-msg error">{t("itinerary.saveError")}</p>}
                {saveStatus === "login"   && <p className="save-msg error">{t("itinerary.saveLogin")}</p>}
                <div style={{ display: "flex", gap: 16 }}>
                  <button className="secondary-btn" onClick={resetAll}>{t("itinerary.planAnother")}</button>
                  <button className="primary-btn" onClick={saveItinerary}>
                    <FaBookmark style={{ marginRight: 6 }} /> {t("itinerary.saveItinerary")}
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default Itinerary;
