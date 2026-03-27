import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";
import { FaGem, FaInstagram, FaTwitter } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "../App.css";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT: BRAND */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <FaGem style={{ color: "#FFD166", fontSize: "1.4rem" }} />
            <span className="logo-text">
              <span style={{ color: "#fff", fontWeight: 700 }}>Island </span>
              <span style={{ color: "#FFD166", fontWeight: 700 }}>Gems</span>
            </span>
          </Link>

          <p className="footer-description">{t("footer.description")}</p>

          {/* SOCIAL MEDIA — replace href values with your own pages */}
          <div className="footer-socials">
            <a
              href="https://www.instagram.com/islandgems23/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/IslandGems23"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

        {/* EXPLORE */}
        <div className="footer-links">
          <h4>{t("footer.explore.title")}</h4>
          <Link to="/explore">{t("footer.explore.beaches")}</Link>
          <Link to="/explore">{t("footer.explore.nature")}</Link>
          <Link to="/explore">{t("footer.explore.restaurants")}</Link>
          <Link to="/explore">{t("footer.explore.culture")}</Link>
          <Link to="/explore">{t("footer.explore.adventure")}</Link>
        </div>

        {/* SUPPORT */}
        <div className="footer-links">
          <h4>{t("footer.support.title")}</h4>
          <Link to="/support">{t("footer.support.help")}</Link>
          <Link to="/support">{t("footer.support.tips")}</Link>
          <Link to="/support">{t("footer.support.safety")}</Link>
          <Link to="/support">{t("footer.support.faq")}</Link>
          <Link to="/contact">{t("footer.support.contact")}</Link>
        </div>

        {/* CONTACT */}
        <div className="footer-contact">
          <h4>{t("footer.contact.title")}</h4>
          <p>
            <a
              href="https://www.google.com/maps/place/Port+Louis,+Mauritius"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <MapPin size={16} /> {t("footer.contact.address")}
            </a>
          </p>
          <p>
            <a
              href="mailto:islandgems23@gmail.com"
              style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Mail size={16} /> {t("footer.contact.email")}
            </a>
          </p>
          <p>
            <a
              href="tel:+2301234567"
              style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Phone size={16} /> {t("footer.contact.phone")}
            </a>
          </p>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <p>{t("footer.bottom.copyright")}</p>
        <div className="footer-bottom-links">
          <Link to="#">{t("footer.bottom.privacy")}</Link>
          <Link to="#">{t("footer.bottom.terms")}</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
