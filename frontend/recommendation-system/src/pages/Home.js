import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import BackToTop from "../components/BackToTop";
import ShareButton from "../components/ShareButton";
import heroVideo from "../assets/4782135-uhd_3840_2160_25fps.mp4";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });




// Star rating helper
function StarRating({ value }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="star-rating" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={
          rounded >= i ? "star-full" :
          rounded >= i - 0.5 ? "star-half" : "star-empty"
        }>★</span>
      ))}
      <span className="star-value">{value}</span>
    </span>
  );
}

function Home() {
  const { user } = useAuth();
  const [persona, setPersona] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  const [attractionsError, setAttractionsError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Map pins — geocoded from trending attraction names
  const [mapPins, setMapPins] = useState([]);

  // Live stats from DB
  const [siteStats, setSiteStats] = useState(null);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/stats/overview`)
      .then(res => res.json())
      .then(data => setSiteStats(data))
      .catch(() => {});
  }, []);

  // Scroll fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("fade-in-visible");
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fade-in-section").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [attractions]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [allAttractionNames, setAllAttractionNames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchBoxRef = useRef(null);

  // Fetch all attraction names for autocomplete
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/attractions`)
      .then(res => res.json())
      .then(data => setAllAttractionNames(data.map(d => d.attraction_name)))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIndex(-1);
    if (val.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = allAttractionNames
      .filter(name => name.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [allAttractionNames]);

  const selectSuggestion = useCallback((name) => {
    setSearchQuery(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    navigate(`/explore/${encodeURIComponent(name)}`);
  }, [navigate]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
      setShowSuggestions(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else if (searchQuery.trim()) {
        setShowSuggestions(false);
        navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [suggestions, activeIndex, searchQuery, selectSuggestion, navigate]);

  const handleExploreClick = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/explore");
    }
  };

  // Fetch map pins once trending attractions are loaded
  useEffect(() => {
    if (attractions.length === 0) return;
    const names = attractions.slice(0, 10)
      .map(a => encodeURIComponent(a.attraction_name)).join(',');
    fetch(`${process.env.REACT_APP_API_URL}/api/map-pins?names=${names}`)
      .then(res => res.json())
      .then(data => setMapPins(data))
      .catch(() => {});
  }, [attractions]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/trending-attractions`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Trending attractions loaded:", data);
        setAttractions(data);
        setAttractionsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load attractions:", err);
        setAttractionsError(err.message);
        setAttractionsLoading(false);
      });
  }, []);


const handlePersonaClick = (type) => {
  if (!user) {
    navigate("/login-selection");
    return;
  }
  setPersona(type);
  navigate("/plan-trip", { state: { persona: type.toLowerCase() } });
};


  return (
    <div className="home">
      <Header active="home" />

      <main className="container-fluid p-0">

        {/* HERO SECTION */}
        <section
          className="hero-section d-flex align-items-center"
          role="banner"
          aria-label={t("hero.ariaLabel")}
        >

          <video
            className="hero-video"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
          />

          <div className="hero-overlay"></div>

          <div className="hero-section-content container text-center">

            <div className="hero-badge"> {t("hero.badge")}</div>
            <h1>
              {t("hero.titlePre")}{" "}
              <span className="title-highlight">{t("hero.titleHighlight")}</span>{" "}
              {t("hero.titlePost")}
            </h1>
            <p className="hero-subtitle">{t("hero.subtitle")}</p>

            {/* SEARCH */}
            <div
              ref={searchBoxRef}
              style={{ position: "relative", maxWidth: "650px", margin: "30px auto 50px" }}
            >
            <div className="search-box d-flex" style={{ margin: 0 }}>
              <label htmlFor="home-search" className="visually-hidden">
                {t("hero.searchLabel")}
              </label>
              <input
                id="home-search"
                type="text"
                className="form-control"
                placeholder={t("hero.searchPlaceholder")}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="home-autocomplete-list"
                aria-activedescendant={activeIndex >= 0 ? `home-suggestion-${activeIndex}` : undefined}
              />
              <button type="button" className="btn btn-primary" onClick={handleExploreClick}>
                {t("hero.exploreBtn")}
              </button>
            </div>

            {showSuggestions && (
              <ul
                id="home-autocomplete-list"
                role="listbox"
                className="autocomplete-list"
                style={{ top: "calc(100% + 4px)", left: 0, right: 0 }}
                aria-label={t("hero.searchLabel")}
              >
                {suggestions.map((name, i) => (
                  <li
                    key={name}
                    id={`home-suggestion-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`autocomplete-option${i === activeIndex ? " active" : ""}`}
                    onMouseDown={() => selectSuggestion(name)}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
            </div>

            {/* PERSONAS */}
            <p className="persona-label mt-3 text-center">{t("hero.travelAs")}</p>

            <div className="personas row g-3 justify-content-center justify-content-lg-start">
              {["Family", "Couple", "Solo"].map((type) => (
                <div key={type} className="col-12 col-sm-6 col-lg-4">
                  <button
                    type="button"
                    className={`persona-card w-100 ${persona === type ? "active" : ""}`}
                    onClick={() => handlePersonaClick(type)}
                    aria-pressed={persona === type}
                  >
                    <h4>{t(`personas.${type}.label`)}</h4>
                    <p>{t(`personas.${type}.desc`)}</p>
                  </button>
                </div>
              ))}
            </div>

            {/* STATS */}
            <div className="stats row text-center mt-4">
              <div className="col-4">
                <strong>{siteStats ? `${siteStats.total_attractions}+` : "…"}</strong>
                <span>{t("stats.attractions")}</span>
              </div>
              <div className="col-4">
                <strong>{siteStats ? `${Number(siteStats.total_reviews).toLocaleString()}+` : "…"}</strong>
                <span>Reviews</span>
              </div>
              <div className="col-4">
                <strong>{siteStats ? `${siteStats.avg_rating}★` : "…"}</strong>
                <span>Avg Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* TOP 10 TRENDING ATTRACTIONS */}
        <section className="section container fade-in-section">
          <h2 className="text-center">{t("featured.title")}</h2>
          <p className="trending-subtitle text-center">Updated weekly based on visitor reviews</p>

          {attractionsLoading && (
            <p className="text-center" style={{ color: "#64748b", padding: "40px 0" }}>
              Loading attractions...
            </p>
          )}

          {attractionsError && (
            <p className="text-center" style={{ color: "#e53e3e", padding: "40px 0" }}>
              Could not load attractions. Make sure the backend server is running.
            </p>
          )}

          {!attractionsLoading && !attractionsError && attractions.length === 0 && (
            <p className="text-center" style={{ color: "#64748b", padding: "40px 0" }}>
              No trending attractions found. Add data to the trending_attractions table.
            </p>
          )}

          <div className="trending-grid">
            {attractions.map((attraction, index) => (
              <div
                key={attraction.id}
                className="trending-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/explore/${encodeURIComponent(attraction.attraction_name)}`)}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${attraction.attraction_name}`}
                onKeyDown={e => e.key === "Enter" && navigate(`/explore/${encodeURIComponent(attraction.attraction_name)}`)}
              >
                <div
                  className="trending-card-img"
                  style={{
                    backgroundImage: attraction.photo_url
                      ? `url(${attraction.photo_url})`
                      : `linear-gradient(135deg, #26c6da, #0077b6)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="trending-rank">#{index + 1}</span>
                  {attraction.trend && (
                    <span className="trending-badge">{attraction.trend}</span>
                  )}
                </div>

                <div className="trending-card-body">
                  <h4 className="trending-name">{attraction.attraction_name}</h4>

                  <div className="trending-stats">
                    {attraction.avg_stars && (
                      <StarRating value={parseFloat(attraction.avg_stars).toFixed(1)} />
                    )}
                  </div>
                  {attraction.reviews_last_7d != null && (
                    <div className="trending-reviews-pill">
                      <i className="bi bi-chat-square-text"></i>
                      {attraction.reviews_last_7d} this week
                    </div>
                  )}

                  <div
                    style={{ marginTop: 10 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <ShareButton
                      title={attraction.attraction_name}
                      text={`Check out ${attraction.attraction_name} — one of Mauritius' top attractions!`}
                      url={`${window.location.origin}/explore/${encodeURIComponent(attraction.attraction_name)}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* PLANNER SECTION */}
        <section className="planner-section fade-in-section delay-1">
          <div className="planner-inner container">

            {/* LEFT — text + steps */}
            <div className="planner-left">
              <span className="section-badge">{t("planner.badge")}</span>
              <h2 className="planner-heading">
                {t("planner.heading1")}<br />
                <span className="planner-highlight">{t("planner.heading2")}</span>
              </h2>
              <p className="planner-desc">{t("planner.desc")}</p>

              <div className="planner-steps">
                {[
                  { n: "1", title: t("planner.s1title"), sub: t("planner.s1sub") },
                  { n: "2", title: t("planner.s2title"), sub: t("planner.s2sub") },
                  { n: "3", title: t("planner.s3title"), sub: t("planner.s3sub") },
                ].map(s => (
                  <div key={s.n} className="planner-step">
                    <div className="planner-step-num">{s.n}</div>
                    <div className="planner-step-text">
                      <strong>{s.title}</strong>
                      <span>{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="planner-cta-btn" onClick={() => navigate("/plan-trip")}>
                {t("planner.cta")}
              </button>
            </div>

            {/* RIGHT — mock itinerary card */}
            <div className="planner-right">
              <div className="mock-card">
                <div className="mock-card-header">
                  <div>
                    <span className="mock-card-title">7-Day Couple Trip</span>
                    <span className="mock-card-sub">Mauritius · Personalised Plan</span>
                  </div>
                  <span className="mock-card-badge">Beaches · Nature</span>
                </div>

                <div className="mock-days">
                  {[
                    { day: 1, slots: ["Le Morne Beach", "Black River Gorges", "Tamarin Sunset"] },
                    { day: 2, slots: ["Île aux Cerfs", "Snorkelling Tour", "Seafood Dinner"] },
                    { day: 3, slots: ["Chamarel Waterfalls", "Seven Colored Earth", "Free evening"] },
                  ].map(d => (
                    <div key={d.day} className="mock-day-row">
                      <span className="mock-day-num">Day {d.day}</span>
                      <div className="mock-slots">
                        {["🌅", "☀️", "🌙"].map((icon, i) => (
                          <span key={i} className="mock-slot-item">{icon} {d.slots[i]}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mock-card-fade" />

                <div className="mock-card-footer">
                  <span>✦ Based on 12,000+ visitor reviews</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* EXPLORE THE ISLAND */}
        <section className="explore-island-section fade-in-section delay-2">
          <div className="container">

            <div className="explore-island-header">
              <span className="section-badge dark">{t("exploreIsland.badge")}</span>
              <h2 className="explore-island-title">{t("exploreIsland.title")}</h2>
              <p className="explore-island-sub">{t("exploreIsland.sub")}</p>
            </div>

            {/* CATEGORY CARDS */}
            <div className="explore-cat-grid">
              {[
                { icon: "🏖️", labelKey: "exploreIsland.cat1label", descKey: "exploreIsland.cat1desc", filter: "Beach" },
                { icon: "🌿", labelKey: "exploreIsland.cat2label", descKey: "exploreIsland.cat2desc", filter: "Nature" },
                { icon: "🏛️", labelKey: "exploreIsland.cat3label", descKey: "exploreIsland.cat3desc", filter: "Cultural" },
                { icon: "🧗", labelKey: "exploreIsland.cat4label", descKey: "exploreIsland.cat4desc", filter: "Adventure" },
              ].map(cat => (
                <button
                  key={cat.filter}
                  className="explore-cat-card"
                  onClick={() => navigate(`/explore?type=${cat.filter}`)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <strong className="cat-label">{t(cat.labelKey)}</strong>
                  <span className="cat-desc">{t(cat.descKey)}</span>
                  <span className="cat-arrow">→</span>
                </button>
              ))}
            </div>

            {/* MAP */}
            <div className="explore-map-wrapper">
              <MapContainer
                center={[-20.3, 57.5]}
                zoom={10}
                style={{ height: "420px", width: "100%", borderRadius: "20px" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapPins.map((pin, i) => (
                  <Marker key={i} position={[pin.lat, pin.lng]}>
                    <Popup>
                      <strong>{pin.name}</strong><br />
                      <button
                        style={{ marginTop: 6, padding: "4px 10px", background: "#00acc1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
                        onClick={() => navigate(`/explore/${encodeURIComponent(pin.name)}`)}
                      >
                        View Details
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="explore-island-cta">
              <button className="planner-cta-btn dark" onClick={() => navigate("/explore")}>
                {t("exploreIsland.cta")}
              </button>
            </div>

          </div>
        </section>

        {/* ── Hotel Partner Banner ── */}
        <section style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 70%, #00acc1 100%)", padding: "60px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <i className="bi bi-building" style={{ fontSize: 32, color: "#00acc1" }}></i>
                <h2 style={{ color: "#fff", margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>Do you manage a hotel in Mauritius?</h2>
              </div>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "1rem", maxWidth: 520 }}>
                Get free access to your guests' real sentiment data and performance analytics — powered by thousands of verified reviews.
              </p>
            </div>
            <button
              onClick={() => navigate("/partners")}
              style={{ background: "#00acc1", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Learn More →
            </button>
          </div>
        </section>

      </main>
      <BackToTop />
    </div>
  );
}

export default Home;