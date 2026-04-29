import { useNavigate } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const Footer = () => {
  const navigate = useNavigate();
  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  return (
    <footer
      style={{
        borderTop: "1px solid #1a1a1a",
        padding: "32px 24px",
        marginTop: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        {/* Left: logo + copyright */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "200px" }}>
          <button
            onClick={() => handleLink("/")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            aria-label="GOPARTARA home"
          >
            <span
              className="logo-text"
              style={{ fontFamily: '"Barlow Condensed", system-ui, sans-serif', fontWeight: 700, fontSize: "18px", letterSpacing: "0.05em" }}
            >
              <span className="logo-go">GO</span>
              <span className="logo-part">PARTARA</span>
            </span>
          </button>
          <span
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: "12px",
              color: "#444444",
              fontWeight: 400,
            }}
          >
            © 2026 GOPARTARA Ltd. All rights reserved.
          </span>
        </div>

        {/* Center: horizontal link list */}
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0",
            justifyContent: "center",
          }}
        >
          {FOOTER_LINKS.map((link, i) => (
            <span key={link.label} style={{ display: "inline-flex", alignItems: "center" }}>
              <button
                onClick={() => handleLink(link.href)}
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: "12px",
                  color: "#666666",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 10px",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666666")}
              >
                {link.label}
              </button>
              {i < FOOTER_LINKS.length - 1 && (
                <span style={{ color: "#2a2a2a", fontSize: "12px" }}>·</span>
              )}
            </span>
          ))}
        </nav>

        {/* Right: socials + Made in UK */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
              href="https://www.instagram.com/gopartara"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              style={{ color: "#444444", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444444")}
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://x.com/gopartara"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              style={{ color: "#444444", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444444")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://youtube.com/@gopartara"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              style={{ color: "#444444", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444444")}
            >
              <Youtube size={16} />
            </a>
          </div>
          <span
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: "11px",
              color: "#333333",
              letterSpacing: "0.04em",
            }}
          >
            Made in the UK
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "16px auto 0" }}>
        <p
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: "11px",
            color: "#333333",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Prices shown are from third-party suppliers and may vary. GOPARTARA may earn a commission.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
