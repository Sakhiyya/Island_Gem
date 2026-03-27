import { useNavigate } from "react-router-dom";

export default function Partners() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "bi-bar-chart-fill",
      title: "Real-Time Sentiment Dashboard",
      desc: "See exactly how guests feel about your property — broken down by cleanliness, food, service, location and more.",
    },
    {
      icon: "bi-trophy-fill",
      title: "Competitor Benchmarking",
      desc: "Understand how your hotel compares to others in Mauritius across every aspect that matters to travellers.",
    },
    {
      icon: "bi-graph-up-arrow",
      title: "Trend Tracking",
      desc: "Track your rating trends month by month and identify what's driving improvements or drops in guest satisfaction.",
    },
  ];

  const steps = [
    { num: "1", title: "Submit a Request", desc: "Fill in your details and tell us which hotel you manage." },
    { num: "2", title: "Get Approved",     desc: "Our team reviews your request and verifies your property within 24 hours." },
    { num: "3", title: "Access Dashboard", desc: "Log in and view your hotel's full analytics dashboard immediately." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 65%, #00acc1 100%)", padding: "100px 24px 80px", textAlign: "center", position: "relative" }}>
        <button
          onClick={() => navigate("/")}
          style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 10, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <i className="bi bi-arrow-left"></i> Back to Home
        </button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,172,193,0.15)", border: "1px solid rgba(0,172,193,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ color: "#00acc1", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>HOTEL PARTNER PROGRAMME</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.2 }}>
          Know what your guests<br />really think
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.15rem", maxWidth: 560, margin: "0 auto 40px" }}>
          Island Gems analyses thousands of real reviews so you don't have to.
          Get free access to your hotel's sentiment analytics dashboard.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/stakeholder-register")}
            style={{ background: "#00acc1", color: "#fff", border: "none", borderRadius: 12, padding: "15px 36px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
          >
            Request Free Access →
          </button>
          <button
            onClick={() => navigate("/stakeholder-login")}
            style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "15px 36px", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}
          >
            Already have an account?
          </button>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", color: "#0f172a", fontSize: "1.8rem", fontWeight: 700, marginBottom: 48 }}>
          Everything you need to understand your guests
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 36, marginBottom: 16, color: "#00acc1" }}>
                <i className={`bi ${f.icon}`}></i>
              </div>
              <h3 style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", color: "#0f172a", fontSize: "1.8rem", fontWeight: 700, marginBottom: 48 }}>
            How it works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {steps.map((s) => (
              <div key={s.num} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00acc1, #0f172a)", color: "#fff", fontSize: "1.4rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  {s.num}
                </div>
                <h3 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "70px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 700, marginBottom: 16 }}>
          Ready to get started?
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: "1rem" }}>
          Join hotel managers across Mauritius already using Island Gems.
        </p>
        <button
          onClick={() => navigate("/stakeholder-register")}
          style={{ background: "#00acc1", color: "#fff", border: "none", borderRadius: 12, padding: "15px 40px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
        >
          Request Free Access →
        </button>
      </div>

    </div>
  );
}
