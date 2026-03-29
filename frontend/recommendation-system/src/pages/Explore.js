import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Toast from "../components/Toast";
import BackToTop from "../components/BackToTop";
import "../App.css";
import "./Explore.css";

const SENTIMENT_COLORS = {
  positive: { bg: "#dcfce7", color: "#16a34a" },
  neutral:  { bg: "#f1f5f9", color: "#64748b" },
  negative: { bg: "#fee2e2", color: "#b91c1c" },
};

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Explore() {
  const { t } = useTranslation();
  const location = useLocation();

  const [destinations, setDestinations] = useState([]);
  const [placeTypes, setPlaceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || "";
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating");

  // Sync search from URL param when navigating here from Home
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search");
    if (q) setSearch(q);
  }, [location.search]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const listboxRef = useRef(null);

  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem("favoriteDestinations")) || [];
  });

  // Toast state
  const [toast, setToast] = useState(null);

  // Scroll fade-in observer — re-runs when filtered results change
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("fade-in-visible");
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".explore-card.fade-in-section").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/attractions`)
      .then(res => res.json())
      .then(data => {
        setDestinations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load attractions:", err);
        setLoading(false);
      });

    fetch(`${process.env.REACT_APP_API_URL}/api/attraction-types`)
      .then(res => res.json())
      .then(data => setPlaceTypes(data));
  }, []);

  const filtered = destinations
  .filter(d => {
    const matchType = selectedType === "All" || d.place_type === selectedType;
    const matchSearch = d.attraction_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  })
  .sort((a, b) => {
    if (sortBy === "rating") return (b.avg_stars || 0) - (a.avg_stars || 0);
    if (sortBy === "reviews") return (b.review_count || 0) - (a.review_count || 0);
    if (sortBy === "name") return a.attraction_name.localeCompare(b.attraction_name);
    return 0;
  });

  const toggleFavorite = (name) => {
    const isAdding = !favorites.includes(name);
    const updated = isAdding
      ? [...favorites, name]
      : favorites.filter(f => f !== name);
    setFavorites(updated);
    localStorage.setItem("favoriteDestinations", JSON.stringify(updated));
    setToast({
      message: isAdding ? `Added "${name}" to favourites` : `Removed from favourites`,
      type: isAdding ? "success" : "info",
    });
  };

  // Autocomplete handlers
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    setActiveIndex(-1);
    if (val.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = destinations
      .map(d => d.attraction_name)
      .filter(name => name.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [destinations]);

  const selectSuggestion = useCallback((name) => {
    setSearch(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    searchRef.current?.focus();
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [showSuggestions, suggestions, activeIndex, selectSuggestion]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="explore">
      {/* Skip to main content — WCAG 2.1 AA */}
      <a href="#explore-main" className="skip-to-content">Skip to main content</a>

      <Header active="explore" />

      <main id="explore-main">

        {/* HERO */}
        <section
          className="hero-section"
          role="banner"
          aria-label={t("explore.heroAria")}
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580137189272-c9379f8864fd')" }}
        >
          <div className="hero-overlay"></div>

          <div className="hero-section-content">
            <h1>{t("explore.title")}</h1>
            <p>{t("explore.subtitle")}</p>

            {/* Autocomplete search — ARIA combobox pattern */}
            <div className="search-box" ref={searchRef} style={{ position: "relative" }}>
              <label htmlFor="explore-search" className="visually-hidden">
                {t("explore.searchLabel")}
              </label>
              <input
                id="explore-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="explore-autocomplete-list"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                placeholder={t("explore.searchPlaceholder")}
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {showSuggestions && (
                <ul
                  id="explore-autocomplete-list"
                  role="listbox"
                  ref={listboxRef}
                  className="autocomplete-list"
                  aria-label={t("explore.searchLabel")}
                >
                  {suggestions.map((name, i) => (
                    <li
                      key={name}
                      id={`suggestion-${i}`}
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

            <div style={{ marginTop: "15px" }}>
              <Link to="/explore/map" className="primary-btn">
                {t("explore.exploreMapBtn")}
              </Link>
            </div>
          </div>
        </section>

        {/* FILTER BAR */}
        <section className="explore-filters" aria-label={t("explore.filtersAria")}>
          <button
            type="button"
            className={`filter-btn ${selectedType === "All" ? "active" : ""}`}
            aria-pressed={selectedType === "All"}
            onClick={() => setSelectedType("All")}
          >
            {t("explore.categories.All")}
          </button>
          {placeTypes.map(type => (
            <button
              key={type}
              type="button"
              className={`filter-btn ${selectedType === type ? "active" : ""}`}
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
            >
              {capitalize(type)}
            </button>
          ))}
        </section>

        {/* SORT BAR */}
        <div
          role="group"
          aria-label="Sort destinations"
          className="explore-sort-bar"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <span id="sort-label" style={{ color: "#64748b", fontSize: "0.9rem" }}>Sort by:</span>
          {[
            { value: "rating", label: "Top Rated" },
            { value: "reviews", label: "Most Reviewed" },
            { value: "name", label: "A - Z" },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`filter-btn ${sortBy === opt.value ? "active" : ""}`}
              aria-pressed={sortBy === opt.value}
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>


        {/* RESULTS */}
        <section className="explore-results">
          {/* aria-live announces result count to screen readers when filters change */}
          {!loading && (
            <p className="results-count" aria-live="polite" aria-atomic="true">
              {t("explore.showing")} {filtered.length} {t("explore.destinations")}
            </p>
          )}

          {/* Skeleton loading cards */}
          {loading && (
            <div className="explore-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img shimmer" />
                  <div className="skeleton-body">
                    <div className="skeleton-line shimmer" />
                    <div className="skeleton-line short shimmer" />
                    <div className="skeleton-btn shimmer" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No attractions found</p>
              <p style={{ fontSize: "0.9rem" }}>Try a different search term or filter</p>
              <button className="filter-btn active" onClick={() => { setSearch(""); setSelectedType("All"); }}>
                Clear filters
              </button>
            </div>
          )}

          <div className="explore-grid">
            {filtered.map((item, index) => {
              const sentiment = SENTIMENT_COLORS[item.dominant_sentiment] || SENTIMENT_COLORS.neutral;
              const stars = parseFloat(item.avg_stars) || 0;
              const rounded = Math.round(stars * 2) / 2;
              return (
                <div key={index} className="explore-card fade-in-section">

                  <div className="explore-card-img" style={
                      item.photo_url
                        ? { backgroundImage: `url(${item.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: item.dominant_sentiment === "positive"
                              ? "linear-gradient(135deg, #34d399, #059669)"
                              : item.dominant_sentiment === "negative"
                              ? "linear-gradient(135deg, #f87171, #dc2626)"
                              : "linear-gradient(135deg, #26c6da, #0077b6)" }
                    }>

                    {item.dominant_sentiment && (
                      <span
                        className="card-tag"
                        style={{ background: sentiment.bg, color: sentiment.color }}
                      >
                        {capitalize(item.dominant_sentiment)}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`favorite-btn ${favorites.includes(item.attraction_name) ? "active" : ""}`}
                      onClick={() => toggleFavorite(item.attraction_name)}
                      aria-label={
                        favorites.includes(item.attraction_name)
                          ? t("explore.removeFavorite", { title: item.attraction_name })
                          : t("explore.addFavorite", { title: item.attraction_name })
                      }
                    >
                      ★
                    </button>
                  </div>

                  <div className="card-body">
                    <h4>{item.attraction_name}</h4>
                    <p className="location">{capitalize(item.place_type)}</p>

                    <div className="card-meta">
                      {item.avg_stars && (
                        <span className="star-rating" aria-label={`${stars} out of 5 stars`}>
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={rounded >= i ? "star-full" : rounded >= i - 0.5 ? "star-half" : "star-empty"}>★</span>
                          ))}
                          <span className="star-value">{stars.toFixed(1)}</span>
                        </span>
                      )}
                      <span style={{ color: "#64748b", fontSize: "0.82rem" }}> · {item.review_count} {t("explore.reviews")}</span>
                    </div>

                    <Link
                      className="card-btn"
                      to={`/explore/${encodeURIComponent(item.attraction_name)}`}
                    >
                      {t("explore.viewDetails")}
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <BackToTop />
    </div>
  );
}

export default Explore;
