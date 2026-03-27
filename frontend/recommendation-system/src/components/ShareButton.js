import { useState } from "react";
import { FaShareAlt, FaFacebook, FaWhatsapp, FaTwitter, FaCopy, FaCheck } from "react-icons/fa";

// variant: "light" (white text, for dark/image backgrounds) | "card" (teal, for white cards)
function ShareButton({ title, text, url, variant = "light" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl  = url  || window.location.href;
  const shareText = text || title || document.title;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {}
      return;
    }
    setOpen(o => !o);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedUrl  = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${shareText} — ${shareUrl}`);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleNativeShare}
        title="Share"
        style={variant === "card" ? {
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px",
          background: "#e0f7fa", border: "1.5px solid #00acc1",
          borderRadius: "999px", color: "#00838f",
          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          transition: "background 0.2s",
        } : {
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px",
          background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)",
          borderRadius: "999px", color: "#fff",
          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          backdropFilter: "blur(6px)", transition: "background 0.2s",
        }}
      >
        <FaShareAlt /> Share
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          padding: "10px 8px",
          zIndex: 100,
          minWidth: 180,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank" rel="noopener noreferrer"
            style={socialLinkStyle("#1877f2")}
          >
            <FaFacebook /> Facebook
          </a>
          <a
            href={`https://wa.me/?text=${encodedText}`}
            target="_blank" rel="noopener noreferrer"
            style={socialLinkStyle("#25d366")}
          >
            <FaWhatsapp /> WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            style={socialLinkStyle("#1da1f2")}
          >
            <FaTwitter /> X / Twitter
          </a>
          <button onClick={copyLink} style={copyBtnStyle}>
            {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy link</>}
          </button>
        </div>
      )}

      {/* Click-outside close */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

const socialLinkStyle = (color) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 14px",
  borderRadius: 9,
  textDecoration: "none",
  fontSize: "0.87rem",
  fontWeight: 600,
  color,
  background: "transparent",
  transition: "background 0.15s",
});

const copyBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 14px",
  borderRadius: 9,
  border: "none",
  background: "transparent",
  fontSize: "0.87rem",
  fontWeight: 600,
  color: "#475569",
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
};

export default ShareButton;
