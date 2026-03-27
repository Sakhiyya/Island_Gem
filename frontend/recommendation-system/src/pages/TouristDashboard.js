import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { FaStar, FaMapMarkerAlt, FaCommentAlt, FaSmile } from "react-icons/fa";
import "./TouristDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const PALETTE = [
  "#46647C", "#4FC3CC", "#6FD6DC", "#9FB5BE",
  "#7E9AA4", "#2E8B9A", "#5AAEBC", "#3D7A8A",
  "#B8D0D8", "#1D6570",
];

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral:  "#94a3b8",
  negative: "#ef4444",
};

const axisStyle = {
  grid: { color: "#ECF2F4" },
  ticks: { color: "#46647C" },
};

function TouristDashboard() {
  const [overview,     setOverview]     = useState(null);
  const [topRated,     setTopRated]     = useState([]);
  const [sentiment,    setSentiment]    = useState([]);
  const [aspects,      setAspects]      = useState([]);
  const [placeTypes,   setPlaceTypes]   = useState([]);
  const [travelTypes,  setTravelTypes]  = useState([]);
  const [monthly,      setMonthly]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/overview`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/top-rated`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/sentiment`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/aspects`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/place-types`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/travel-types`).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/stats/monthly`).then(r => r.json()),
    ])
      .then(([ov, tr, sent, asp, pt, tt, mon]) => {
        setOverview(ov);
        setTopRated(Array.isArray(tr) ? tr : []);
        setSentiment(Array.isArray(sent) ? sent : []);
        setAspects(Array.isArray(asp) ? asp : []);
        setPlaceTypes(Array.isArray(pt) ? pt : []);
        setTravelTypes(Array.isArray(tt) ? tt : []);
        setMonthly(Array.isArray(mon) ? mon : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <Header active="tourist" />
        <div className="tourist-dashboard">
          <div className="dashboard-header">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Sentiment chart ──────────────────────────────────────────────────────
  const sentOrder = ["positive", "neutral", "negative"];
  const sentLabels = sentOrder.filter(s => sentiment.find(r => r.sentiment_label === s));
  const sentCounts = sentLabels.map(s => {
    const found = sentiment.find(r => r.sentiment_label === s);
    return found ? parseInt(found.count) : 0;
  });

  // ── Monthly (last 12) ────────────────────────────────────────────────────
  const recentMonthly = monthly.slice(-12);

  // ── Chart data objects ───────────────────────────────────────────────────
  const topRatedData = {
    labels: topRated.map(r => r.attraction_name),
    datasets: [{
      label: "Avg Rating",
      data: topRated.map(r => parseFloat(r.avg_stars)),
      backgroundColor: PALETTE.slice(0, topRated.length),
      borderRadius: 4,
    }],
  };

  const sentimentData = {
    labels: sentLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: sentCounts,
      backgroundColor: sentLabels.map(s => SENTIMENT_COLORS[s]),
      borderWidth: 0,
    }],
  };

  const aspectsData = {
    labels: aspects.map(a =>
      a.aspect.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    ),
    datasets: [{
      label: "Mentions",
      data: aspects.map(a => parseInt(a.total_mentions)),
      backgroundColor: PALETTE.slice(0, aspects.length),
      borderRadius: 4,
    }],
  };

  const placeTypeData = {
    labels: placeTypes.map(p => p.place_type),
    datasets: [{
      data: placeTypes.map(p => parseInt(p.count)),
      backgroundColor: PALETTE.slice(0, placeTypes.length),
      borderWidth: 0,
    }],
  };

  const travelTypeData = {
    labels: travelTypes.map(t =>
      t.travel_type.charAt(0).toUpperCase() + t.travel_type.slice(1)
    ),
    datasets: [{
      label: "Reviews",
      data: travelTypes.map(t => parseInt(t.count)),
      backgroundColor: PALETTE.slice(0, travelTypes.length),
      borderRadius: 4,
    }],
  };

  const monthlyData = {
    labels: recentMonthly.map(m => m.month_label),
    datasets: [{
      label: "Reviews",
      data: recentMonthly.map(m => parseInt(m.count)),
      borderColor: "#4FC3CC",
      backgroundColor: "rgba(79,195,204,0.15)",
      tension: 0.35,
      fill: true,
      pointRadius: 4,
    }],
  };

  return (
    <>
      <Header active="tourist" />
      <div className="tourist-dashboard">

        {/* HEADER */}
        <div className="dashboard-header">
          <h1>Tourism Analytics Hub</h1>
          <p>
            Explore visitor insights, top-rated destinations, and sentiment trends
            across Mauritius — powered by real review data.
          </p>
        </div>

        {/* KPI CARDS */}
        {overview && (
          <div className="kpi-row">
            <div className="kpi-card">
              <FaMapMarkerAlt className="kpi-icon" />
              <p className="kpi-value">{overview.total_attractions}</p>
              <p className="kpi-label">Attractions</p>
            </div>
            <div className="kpi-card">
              <FaCommentAlt className="kpi-icon" />
              <p className="kpi-value">{Number(overview.total_reviews).toLocaleString()}</p>
              <p className="kpi-label">Total Reviews</p>
            </div>
            <div className="kpi-card">
              <FaStar className="kpi-icon star" />
              <p className="kpi-value">{overview.avg_rating}</p>
              <p className="kpi-label">Avg Rating</p>
            </div>
            <div className="kpi-card">
              <FaSmile className="kpi-icon smile" />
              <p className="kpi-value">{overview.positive_pct}%</p>
              <p className="kpi-label">Positive Reviews</p>
            </div>
          </div>
        )}

        {/* CHARTS GRID */}
        <div className="dashboard-grid">

          {/* TOP 10 RATED — horizontal bar, spans 2 cols */}
          <div className="dashboard-card wide-card">
            <h3>Top 10 Rated Attractions</h3>
            <p className="chart-subtitle">Average star rating (min. 3 reviews)</p>
            <div className="chart-container" style={{ height: 340 }} role="img" aria-label="Horizontal bar chart showing the top 10 highest-rated attractions by average star rating">
              <Bar
                data={topRatedData}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { beginAtZero: false, min: 1, max: 5, ...axisStyle },
                    y: {
                      ticks: { color: "#46647C", font: { size: 11 } },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* SENTIMENT DISTRIBUTION */}
          <div className="dashboard-card">
            <h3>Overall Sentiment</h3>
            <p className="chart-subtitle">Breakdown of visitor review sentiment</p>
            <div className="chart-container small-chart" role="img" aria-label="Doughnut chart showing the percentage breakdown of positive, neutral, and negative visitor reviews">
              <Doughnut
                data={sentimentData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", labels: { color: "#46647C" } },
                  },
                }}
              />
            </div>
          </div>

          {/* ATTRACTION TYPES */}
          <div className="dashboard-card">
            <h3>Attraction Types</h3>
            <p className="chart-subtitle">Number of distinct places per category</p>
            <div className="chart-container small-chart" role="img" aria-label="Doughnut chart showing the number of distinct attractions per category such as beach, nature, culture, and adventure">
              <Doughnut
                data={placeTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#46647C", font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* MONTHLY TREND — spans 2 cols */}
          <div className="dashboard-card wide-card">
            <h3>Review Volume Over Time</h3>
            <p className="chart-subtitle">Number of tourist reviews per month (last 12 months)</p>
            <div className="chart-container" role="img" aria-label="Line chart showing the number of tourist reviews submitted each month over the last 12 months">
              <Line
                data={monthlyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ...axisStyle },
                    x: { ticks: { color: "#46647C" }, grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {/* MOST DISCUSSED ASPECTS — spans 2 cols */}
          <div className="dashboard-card wide-card">
            <h3>Most Discussed Aspects</h3>
            <p className="chart-subtitle">Top topics mentioned across all reviews</p>
            <div className="chart-container" style={{ height: 280 }} role="img" aria-label="Bar chart showing the most frequently mentioned aspects in tourist reviews such as food, cleanliness, and service">
              <Bar
                data={aspectsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ...axisStyle },
                    x: { ticks: { color: "#46647C" }, grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {/* TRAVELLER PROFILE */}
          {travelTypes.length > 0 && (
            <div className="dashboard-card">
              <h3>Traveller Profile</h3>
              <p className="chart-subtitle">Who visits Mauritius attractions</p>
              <div className="chart-container" style={{ height: 260 }} role="img" aria-label="Bar chart showing the distribution of visitor types such as solo, couple, family, group, and business travellers">
                <Bar
                  data={travelTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ...axisStyle },
                      x: { ticks: { color: "#46647C" }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default TouristDashboard;
