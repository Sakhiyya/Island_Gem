import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../auth/AuthContext";
import {
  FaCalendarAlt, FaMapMarkerAlt, FaStar,
  FaTrashAlt, FaChevronDown, FaChevronUp,
  FaBookmark, FaPlane,
} from "react-icons/fa";
import wavesVideo from "../assets/1409899-uhd_3840_2160_25fps.mp4";
import "../App.css";
import "./SavedItineraries.css";

const TRAVEL_TYPE_LABELS = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  group: "Group",
  business: "Business",
};

const DAY_SLOTS = ["Morning", "Afternoon", "Evening"];

function SavedItineraries() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expanded, setExpanded]       = useState(null); // id of expanded card
  const [deleting, setDeleting]       = useState(null); // id being deleted

  useEffect(() => {
    if (!user) {
      navigate("/login-selection");
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/api/itinerary/saved?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        setItineraries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load your itineraries. Please try again.");
        setLoading(false);
      });
  }, [user, navigate]);

  const toggleExpand = (id) => setExpanded(prev => (prev === id ? null : id));

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this itinerary?")) return;
    setDeleting(id);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/itinerary/saved/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      setItineraries(prev => prev.filter(it => it.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      alert("Could not delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="saved-page">
      <video autoPlay loop muted playsInline className="video-background">
        <source src={wavesVideo} type="video/mp4" />
      </video>
      <div className="video-overlay" />
      <Header active="saved" />

      <main className="saved-wrapper">
        <div className="saved-header-row">
          <h1>
            <FaBookmark style={{ color: "#39d7ec", marginRight: 12 }} />
            My Saved Itineraries
          </h1>
          <button className="primary-btn" onClick={() => navigate("/plan-trip")}>
            <FaPlane style={{ marginRight: 8 }} /> Plan a New Trip
          </button>
        </div>

        {loading && <p className="saved-status">Loading your itineraries...</p>}
        {error   && <p className="saved-status error">{error}</p>}

        {!loading && !error && itineraries.length === 0 && (
          <div className="saved-empty">
            <FaBookmark style={{ fontSize: 48, color: "rgba(255,255,255,0.3)", marginBottom: 16 }} />
            <p>You have no saved itineraries yet.</p>
            <button className="primary-btn" onClick={() => navigate("/plan-trip")}>
              Plan Your First Trip
            </button>
          </div>
        )}

        <div className="saved-list">
          {itineraries.map(it => {
            const plan = Array.isArray(it.itinerary_data) ? it.itinerary_data : [];
            const isOpen = expanded === it.id;

            return (
              <div key={it.id} className="saved-card">

                {/* Card summary row */}
                <div className="saved-card-top" onClick={() => toggleExpand(it.id)}>
                  <div className="saved-card-info">
                    <span className="saved-trip-title">
                      {it.days}-Day {TRAVEL_TYPE_LABELS[it.travel_type] || it.travel_type} Trip
                    </span>
                    <span className="saved-meta">
                      <FaCalendarAlt style={{ marginRight: 6, color: "#39d7ec" }} />
                      Saved {formatDate(it.created_at)}
                    </span>
                    {it.interests && it.interests.length > 0 && (
                      <span className="saved-interests">
                        {it.interests.join(" · ")}
                      </span>
                    )}
                  </div>
                  <div className="saved-card-actions">
                    <button
                      className="delete-btn"
                      disabled={deleting === it.id}
                      onClick={e => { e.stopPropagation(); handleDelete(it.id); }}
                      title="Delete itinerary"
                    >
                      <FaTrashAlt />
                    </button>
                    <span className="expand-icon">
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </div>
                </div>

                {/* Expanded day-by-day plan */}
                {isOpen && (
                  <div className="saved-card-body">
                    {plan.length === 0 ? (
                      <p style={{ color: "rgba(255,255,255,0.5)" }}>No plan data available.</p>
                    ) : (
                      <div className="saved-itinerary-grid">
                        {plan.map(day => (
                          <div key={day.day} className="saved-day-card">
                            <h3>
                              <FaCalendarAlt style={{ marginRight: 8, color: "#39d7ec" }} />
                              Day {day.day}
                            </h3>
                            {day.attractions.length === 0 ? (
                              <p className="free-day">Free day</p>
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
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default SavedItineraries;
