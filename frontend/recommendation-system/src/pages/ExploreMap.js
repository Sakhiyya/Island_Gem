import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Popup, Circle } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "leaflet/dist/leaflet.css";

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral:  "#94a3b8",
  negative: "#ef4444",
};

function ExploreMap() {
  const navigate = useNavigate();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all attractions, then geocode top 20 (limited for Nominatim rate limit)
    fetch(`${process.env.REACT_APP_API_URL}/api/attractions`)
      .then(res => res.json())
      .then(data => {
        const top = data.slice(0, 20);
        const names = top.map(a => encodeURIComponent(a.attraction_name)).join(',');

        // Build a lookup for attraction details
        const detailMap = {};
        top.forEach(a => { detailMap[a.attraction_name.toLowerCase()] = a; });

        return fetch(`${process.env.REACT_APP_API_URL}/api/map-pins?names=${names}`)
          .then(res => res.json())
          .then(coords => {
            const combined = coords.map(c => ({
              ...c,
              ...(detailMap[c.name.toLowerCase()] || {}),
            }));
            setPins(combined);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: "100px", paddingBottom: "50px", paddingLeft: "40px", paddingRight: "40px" }}>
      <Header active="map" />
      <h2 style={{ marginBottom: "8px" }}>Explore on Map</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>
        {loading
          ? "Locating attractions on map… (first load may take a moment)"
          : `Showing ${pins.length} attractions · Color = sentiment`}
      </p>

      <MapContainer center={[-20.2, 57.55]} zoom={10} style={{ height: "600px", width: "100%", borderRadius: "16px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pins.map((pin, i) => (
          <Circle
            key={i}
            center={[pin.lat, pin.lng]}
            radius={500}
            pathOptions={{
              color: SENTIMENT_COLORS[pin.dominant_sentiment] || SENTIMENT_COLORS.neutral,
              fillColor: SENTIMENT_COLORS[pin.dominant_sentiment] || SENTIMENT_COLORS.neutral,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <strong>{pin.name}</strong><br />
              {pin.place_type && <>Type: {pin.place_type}<br /></>}
              {pin.avg_stars && <>⭐ {pin.avg_stars} · {pin.review_count} reviews<br /></>}
              {pin.dominant_sentiment && <>Sentiment: {pin.dominant_sentiment}<br /></>}
              <button
                style={{ marginTop: 6, padding: "4px 10px", background: "#00acc1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
                onClick={() => navigate(`/explore/${encodeURIComponent(pin.name)}`)}
              >
                View Details
              </button>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      <Footer />
    </div>
  );
}

export default ExploreMap;
