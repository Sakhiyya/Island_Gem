import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import BackToTop from "../components/BackToTop";
import { FaStar, FaGlobe, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";

const SENTIMENT_COLORS = {
  positive: { bg: "#dcfce7", color: "#16a34a" },
  neutral:  { bg: "#f1f5f9", color: "#64748b" },
  negative: { bg: "#fee2e2", color: "#b91c1c" },
};

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function AspectReviews() {
  const { id, aspect } = useParams();
  const aspectLabel = decodeURIComponent(aspect).replace(/_/g, " ");
  const attractionName = decodeURIComponent(id);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(
      `${process.env.REACT_APP_API_URL}/api/attractions/${encodeURIComponent(id)}/aspect-reviews?aspect=${encodeURIComponent(aspect)}`
    )
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, aspect]);

  const sentimentCounts = reviews.reduce((acc, r) => {
    const label = r.sentiment_label || "neutral";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Header />
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "100px 24px 48px" }}>

        {/* Back link */}
        <Link
          to={`/explore/${encodeURIComponent(id)}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#00acc1",
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: "28px",
            fontSize: "0.95rem",
          }}
        >
          <FaArrowLeft /> Back to {attractionName}
        </Link>

        {/* Page heading */}
        <div style={{
          background: "linear-gradient(135deg, #e0f7fa, #f0f9ff)",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "32px",
          borderLeft: "5px solid #00acc1",
        }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 6px" }}>
            {attractionName}
          </p>
          <h2 style={{ margin: "0 0 8px", color: "#0d2238", fontSize: "1.6rem" }}>
            Reviews about <em style={{ color: "#00acc1", fontStyle: "normal" }}>
              {capitalize(aspectLabel)}
            </em>
          </h2>

          {!loading && (
            <>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  <strong style={{ color: "#0d2238" }}>{reviews.length}</strong> reviews
                </span>
                {Object.entries(sentimentCounts).map(([label, count]) => {
                  const sc = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.neutral;
                  return (
                    <span
                      key={label}
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        padding: "2px 10px",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                      }}
                    >
                      {capitalize(label)}: {count}
                    </span>
                  );
                })}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Reviews are sorted by relevance — those that directly mention "{aspectLabel}" appear first,
                followed by all other reviews for this attraction.
              </p>
            </>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <p>Loading reviews…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && reviews.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#64748b",
            background: "#f8fafc",
            borderRadius: "14px",
          }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No reviews found</p>
            <Link
              to={`/explore/${encodeURIComponent(id)}`}
              style={{
                display: "inline-block",
                marginTop: "16px",
                background: "#00acc1",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Back to Attraction
            </Link>
          </div>
        )}

        {/* Reviews list */}
        {reviews.map((rev, i) => {
          const sc = SENTIMENT_COLORS[rev.sentiment_label] || SENTIMENT_COLORS.neutral;
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "20px 24px",
                marginBottom: "16px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                borderLeft: `4px solid ${sc.color}`,
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "12px",
              }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem", color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FaStar style={{ color: "#f59e0b" }} /> {rev.stars} / 5
                  </span>
                  {rev.platform && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FaGlobe /> {rev.platform}
                    </span>
                  )}
                  {rev.review_date && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FaCalendarAlt /> {new Date(rev.review_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {rev.sentiment_label && (
                  <span style={{
                    background: sc.bg,
                    color: sc.color,
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}>
                    {capitalize(rev.sentiment_label)}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.7, fontSize: "0.95rem" }}>
                {rev.text_sample}
              </p>
            </div>
          );
        })}

      </main>
      <BackToTop />
    </div>
  );
}

export default AspectReviews;
