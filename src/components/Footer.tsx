import { useNavigate } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";

type FooterSection = {
  title: string;
  links: { label: string; href: string }[];
};

const SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Search", href: "/" },
      { label: "Tyres", href: "/tyres" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Deals", href: "/deals" },
      { label: "My Garage", href: "/garage" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "For Business", href: "/business" },
    ],
  },
  {
    title: "Support",
    links: [{ label: "Help Center", href: "/help" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const Footer = () => {
  const navigate = useNavigate();
  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  return (
    <footer style={{ background: "#0a1628", color: "#cbd5e1" }}>
      <div className="container px-4 md:px-6 lg:px-8" style={{ padding: "28px 16px" }}>
        {/* Logo + description */}
        <div className="mb-8 md:mb-10 md:grid md:grid-cols-5 md:gap-8">
          <div className="md:col-span-1 text-center md:text-left mb-8 md:mb-0">
            <button onClick={() => handleLink("/")} className="inline-block min-h-[44px]">
              <span
                className="logo-text"
                style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}
              >
                <span style={{ color: "#fbbf24" }}>GOPART</span>
                <span style={{ color: "#ffffff" }}>ARA</span>
              </span>
            </button>
            <p
              style={{
                color: "#8fa8c8",
                fontSize: 12,
                marginTop: 12,
                lineHeight: 1.6,
                maxWidth: 320,
              }}
              className="mx-auto md:mx-0"
            >
              The smarter way to find car parts. Search 1,000,000+ parts from trusted global suppliers.
            </p>
          </div>

          {/* Desktop columns */}
          <div className="hidden md:contents">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: 14,
                  }}
                >
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => handleLink(link.href)}
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile 2x2 columns */}
        <div className="md:hidden grid grid-cols-2 gap-x-6 gap-y-8 mb-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLink(link.href)}
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                      }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Socials row */}
        <div
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-center sm:text-left">
            <span style={{ fontSize: 11, color: "#8fa8c8" }}>© 2026 GOPARTARA Ltd. All rights reserved.</span>
            <span style={{ fontSize: 11, color: "#8fa8c8" }}>info@gopartara.com</span>
          </div>

          <div className="flex items-center gap-3">
            {[
              { href: "https://www.instagram.com/gopartara", label: "Instagram", icon: <Instagram size={18} /> },
              {
                href: "https://www.tiktok.com/@gopartara",
                label: "TikTok",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                ),
              },
              {
                href: "https://x.com/gopartara",
                label: "X (Twitter)",
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              { href: "https://youtube.com/@gopartara", label: "YouTube", icon: <Youtube size={18} /> },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  color: "#cbd5e1",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(251,191,36,0.18)";
                  e.currentTarget.style.color = "#fbbf24";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#cbd5e1";
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ background: "#060f1e" }}>
        <div
          className="container px-4 md:px-6 lg:px-8"
          style={{ padding: "12px 16px", color: "#64748b", fontSize: 11, textAlign: "center" }}
        >
          Prices shown are from third-party suppliers and may vary. GOPARTARA may earn a small commission on qualifying purchases at no extra cost to you.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
