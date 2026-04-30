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
    links: [
      { label: "Help Center", href: "/help" },
    ],
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
    <footer style={{ background: "#0a1628", color: "#cbd5e1" }} className="py-12">
      <div className="container px-4 md:px-6 lg:px-8">
        {/* Logo + description */}
        <div className="mb-8 md:mb-12 md:grid md:grid-cols-5 md:gap-8">
          <div className="md:col-span-1 text-center md:text-left mb-8 md:mb-0">
            <button onClick={() => handleLink("/")} className="inline-block min-h-[44px]">
              <span className="logo-text logo-footer text-xl">
                <span className="logo-go">GO</span>
                <span className="logo-part">PART</span>
                <span className="logo-ara">ARA</span>
              </span>
            </button>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: 12, lineHeight: 1.6, maxWidth: "26rem" }} className="mx-auto md:mx-0">
              The smarter way to find car parts. Search 1,000,000+ parts from trusted global suppliers.
            </p>
          </div>

          {/* Desktop columns */}
          <div className="hidden md:contents">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                  {section.title}
                </h4>
                <ul className="space-y-2" style={{ fontSize: 14 }}>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => handleLink(link.href)}
                        style={{ color: "#cbd5e1", transition: "color 150ms ease", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
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
              <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                {section.title}
              </h4>
              <ul className="space-y-2" style={{ fontSize: 14 }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLink(link.href)}
                      className="text-left"
                      style={{ color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24 }} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-center sm:text-left" style={{ color: "#94a3b8", fontSize: 12 }}>
              <span>© 2026 GOPARTARA Ltd. All rights reserved.</span>
              <span>info@gopartara.com</span>
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
              ].map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    transition: "background-color 150ms ease, color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fbbf24";
                    e.currentTarget.style.color = "#0a1628";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#cbd5e1";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <p className="text-center sm:text-left leading-relaxed" style={{ fontSize: 11, color: "#64748b" }}>
            Prices shown are from third-party suppliers and may vary. GOPARTARA may earn a commission.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
