import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BackToTop from "../components/BackToTop";
import { FaStar, FaGlobe, FaCalendarAlt, FaTag, FaCommentAlt, FaArrowLeft, FaChevronDown, FaChevronUp, FaMapMarkerAlt } from "react-icons/fa";
import ShareButton from "../components/ShareButton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./destinationDetails.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const SENTIMENT_COLORS = {
  positive: { bg: "#dcfce7", color: "#16a34a" },
  neutral:  { bg: "#f1f5f9", color: "#64748b" },
  negative: { bg: "#fee2e2", color: "#b91c1c" },
};

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function StarRating({ value }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="star-rating" aria-label={`${value} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={rounded >= i ? "star-full" : rounded >= i - 0.5 ? "star-half" : "star-empty"}>★</span>
      ))}
      <span className="star-value">{value}</span>
    </span>
  );
}

function DestinationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${process.env.REACT_APP_API_URL}/api/attractions/${id}`)
      .then(res => res.json())
      .then(data => { setDestination(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  const handleAspectClick = (aspect) => {
    navigate(`/explore/${encodeURIComponent(id)}/aspect/${encodeURIComponent(aspect)}`);
  };

  // Geocode this attraction for the mini-map
  useEffect(() => {
    if (!destination) return;
    fetch(`${process.env.REACT_APP_API_URL}/api/map-pins?names=${encodeURIComponent(destination.attraction_name)}`)
      .then(res => res.json())
      .then(data => { if (data[0]) setCoords(data[0]); })
      .catch(() => {});
  }, [destination]);

  useEffect(() => {
    if (!destination) return;
    fetch(`${process.env.REACT_APP_API_URL}/api/attractions`)
      .then(res => res.json())
      .then(data => {
        const others = data.filter(
          a => a.place_type === destination.place_type &&
               a.attraction_name.toLowerCase() !== destination.attraction_name.toLowerCase()
        ).slice(0, 3);
        setRelated(others);
      })
      .catch(() => {});
  }, [destination]);

  if (loading) {
    return (
      <div className="dd-page">
        <Header />
        <main className="dd-main">
          <div className="dd-card">
            <div className="shimmer" style={{ width: "100%", height: 220, borderRadius: "16px 16px 0 0" }} />
            <div style={{ padding: "28px 32px" }}>
              <div className="shimmer skeleton-line" style={{ width: "55%", height: 28, marginBottom: 14 }} />
              <div className="shimmer skeleton-line" style={{ width: "35%", height: 18, marginBottom: 24 }} />
              <div style={{ display: "flex", gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ flex: 1, height: 90, borderRadius: 12 }} />)}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!destination || destination.message) {
    return (
      <div className="dd-page">
        <Header />
        <main className="dd-main">
          <p style={{ color: "#64748b" }}>Destination not found.</p>
          <Link to="/explore" className="dd-back-btn">Back to Explore</Link>
        </main>
      </div>
    );
  }

  const sentiment = SENTIMENT_COLORS[destination.dominant_sentiment] || SENTIMENT_COLORS.neutral;
  const reviews = destination.recent_reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  return (
    <div className="dd-page">
      <Header />
      <main className="dd-main">

        {/* Back link */}
        <Link to="/explore" className="dd-back-link">
          <FaArrowLeft /> Back to Explore
        </Link>

        {/* ── MAIN CARD ─────────────────────────────────── */}
        <div className="dd-card">

          {/* Image — full width, natural height, never cropped */}
          {destination.photo_url && (
            <img
              className="dd-photo"
              src={destination.photo_url}
              alt={destination.attraction_name}
            />
          )}

          {/* Info header */}
          <div className="dd-info-header">
            <div className="dd-info-left">
              <h1 className="dd-title">{destination.attraction_name}</h1>
              <div className="dd-badges">
                <span className="dd-badge dd-badge-type">
                  <FaTag style={{ marginRight: 5 }} />{capitalize(destination.place_type)}
                </span>
                <span className="dd-badge" style={{ background: sentiment.bg, color: sentiment.color }}>
                  {capitalize(destination.dominant_sentiment)} sentiment
                </span>
              </div>
            </div>
            <div className="dd-rating-block">
              <StarRating value={parseFloat(destination.avg_stars)} />
              <span className="dd-review-pill">{destination.review_count} reviews</span>
              <ShareButton
                variant="card"
                title={destination.attraction_name}
                text={`Check out ${destination.attraction_name} in Mauritius!`}
              />
            </div>
          </div>
        </div>

        {/* ── WHAT VISITORS SAY ─────────────────────────── */}
        {destination.aspects && destination.aspects.length > 0 && (
          <div className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">What visitors say</h2>
              <span className="dd-section-hint">Click any card to read reviews</span>
            </div>
            <div className="dd-aspects-grid">
              {destination.aspects.map((aspect, i) => {
                const asp = SENTIMENT_COLORS[aspect.aspect_sentiment_label] || SENTIMENT_COLORS.neutral;
                return (
                  <button
                    key={i}
                    className="dd-aspect-card"
                    onClick={() => handleAspectClick(aspect.aspect)}
                    aria-label={`${capitalize(aspect.aspect.replace(/_/g, " "))} — ${aspect.aspect_sentiment_label} — click to see reviews`}
                    style={{ borderTop: `4px solid ${asp.color}` }}
                  >
                    <div className="dd-aspect-sentiment" style={{ color: asp.color }}>
                      {capitalize(aspect.aspect_sentiment_label)}
                    </div>
                    <div className="dd-aspect-name">
                      {capitalize(aspect.aspect.replace(/_/g, " "))}
                    </div>
                    <div className="dd-aspect-mentions">{aspect.total_mentions} mentions</div>
                    <div className="dd-aspect-cta" style={{ color: asp.color }}>Read reviews →</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SIMILAR ATTRACTIONS ───────────────────────── */}
        {related.length > 0 && (
          <div className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">Similar Attractions</h2>
            </div>
            <div className="dd-related-grid">
              {related.map((a, i) => (
                <Link
                  key={i}
                  className="dd-related-card"
                  to={`/explore/${encodeURIComponent(a.attraction_name)}`}
                >
                  {a.photo_url
                    ? <img className="dd-related-img" src={a.photo_url} alt={a.attraction_name} />
                    : <div className="dd-related-img dd-related-placeholder" />
                  }
                  <div className="dd-related-body">
                    <h5>{a.attraction_name}</h5>
                    <p>
                      {a.avg_stars && <><FaStar style={{ color: "#f59e0b", marginRight: 3 }} />{parseFloat(a.avg_stars).toFixed(1)} · </>}
                      {capitalize(a.place_type)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── LOCATION MAP ──────────────────────────────── */}
        {coords && (
          <div className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">
                <FaMapMarkerAlt style={{ marginRight: 8, color: "#00acc1" }} />
                Location
              </h2>
            </div>
            <MapContainer
              center={[coords.lat, coords.lng]}
              zoom={14}
              style={{ height: "300px", width: "100%", borderRadius: "16px" }}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>{destination.attraction_name}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* ── ALL REVIEWS ───────────────────────────────── */}
        {reviews.length > 0 && (
          <div className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">
                <FaCommentAlt style={{ marginRight: 8, color: "#00acc1" }} />
                All Reviews
                <span className="dd-count-badge">{reviews.length}</span>
              </h2>
            </div>
            <div className="dd-reviews-list">
              {visibleReviews.map((rev, i) => {
                const sc = SENTIMENT_COLORS[rev.sentiment_label] || SENTIMENT_COLORS.neutral;
                return (
                  <div key={i} className="dd-review-card" style={{ borderLeft: `4px solid ${sc.color}` }}>
                    <div className="dd-review-meta">
                      <div className="dd-review-meta-left">
                        <span className="dd-review-stars">
                          <FaStar style={{ color: "#f59e0b" }} /> {rev.stars} / 5
                        </span>
                        {rev.platform && <span><FaGlobe style={{ marginRight: 4 }} />{rev.platform}</span>}
                        {rev.review_date && <span><FaCalendarAlt style={{ marginRight: 4 }} />{new Date(rev.review_date).toLocaleDateString()}</span>}
                      </div>
                      {rev.sentiment_label && (
                        <span className="dd-review-sentiment" style={{ background: sc.bg, color: sc.color }}>
                          {capitalize(rev.sentiment_label)}
                        </span>
                      )}
                    </div>
                    <p className="dd-review-text">{rev.text_sample}</p>
                  </div>
                );
              })}
            </div>
            {reviews.length > 4 && (
              <button className="dd-show-more-btn" onClick={() => setShowAllReviews(v => !v)}>
                {showAllReviews
                  ? <><FaChevronUp style={{ marginRight: 6 }} />Show fewer reviews</>
                  : <><FaChevronDown style={{ marginRight: 6 }} />Show all {reviews.length} reviews</>
                }
              </button>
            )}
          </div>
        )}

        <Link to="/explore" className="dd-back-btn">← Back to Explore</Link>

      </main>
      <BackToTop />
    </div>
  );
}

export default DestinationDetails;
