import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  CircleDot,
  Briefcase,
  BookOpen,
  HelpCircle,
  Info,
  Mail as MailIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import MessageBubble from "@/components/MessageBubble";
import CountrySelector from "@/components/CountrySelector";

const primaryLinks = [
  { label: "Search", href: "/search" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Deals", href: "/deals" },
  { label: "Pricing", href: "/pricing" },
];

type MoreLink = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

const moreLinks: MoreLink[] = [
  { label: "Tyres", href: "/tyres", Icon: CircleDot },
  { label: "For Business", href: "/business", Icon: Briefcase },
  { label: "Blog", href: "/blog", Icon: BookOpen },
  { label: "Help Center", href: "/help", Icon: HelpCircle },
  { label: "About", href: "/about", Icon: Info },
  { label: "Contact", href: "/contact", Icon: MailIcon },
];

const ADMIN_EMAIL = "info@gopartara.com";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  const handleMoreEnter = useCallback(() => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    setMoreOpen(true);
  }, []);

  const handleMoreLeave = useCallback(() => {
    moreTimeoutRef.current = setTimeout(() => setMoreOpen(false), 250);
  }, []);

  const handleNavClick = (href: string) => {
    setMoreOpen(false);

    if (href === "/") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
      }
      return;
    }

    navigate(href);
  };

  const handleMobileLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href === "/" && pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-colors"
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          willChange: "transform",
          backgroundColor: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition: "background-color 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease",
        }}
      >
        <div className="container relative flex items-center gap-4" style={{ height: "56px" }}>
          {/* Left: Logo */}
          <a
            href="/"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                window.open("https://gopartara.com", "_blank");
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
              }
            }}
            className="no-underline group flex-shrink-0"
          >
            <span className="logo-text text-xl">
              <span className="logo-go">GO</span>
              <span className="logo-part transition-colors duration-200 group-hover:text-zinc-400">
                PARTARA
              </span>
            </span>
          </a>

          {/* Center: Primary nav links — absolutely centered to viewport */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6 absolute left-1/2 -translate-x-1/2">
            {primaryLinks.map((l) => {
              const isActive =
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <button
                  key={l.label}
                  onClick={() => handleNavClick(l.href)}
                  className="transition-colors"
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#ffffff" : "#a1a1aa",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#a1a1aa";
                  }}
                >
                  {l.label}
                </button>
              );
            })}

            <div className="relative" onMouseEnter={handleMoreEnter} onMouseLeave={handleMoreLeave}>
              <button
                className="transition-colors flex items-center gap-1"
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#a1a1aa",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              >
                More
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-44">
                  <div
                    className="rounded-lg p-1 animate-in fade-in-0 zoom-in-95"
                    style={{
                      backgroundColor: "rgba(10,10,10,0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    {moreLinks.map((l) => {
                      const isActive =
                        pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                      const Icon = l.Icon;
                      return (
                        <button
                          key={l.href}
                          onClick={() => handleNavClick(l.href)}
                          className="w-full rounded-md px-3 py-2 text-left transition-colors flex items-center gap-2.5"
                          style={{
                            fontSize: "13px",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "#ffffff" : "#a1a1aa",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.color = "#a1a1aa";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Icon size={14} className="opacity-70" />
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Utilities + auth */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {!loading && user && <MessageBubble />}
            {!loading && user && <NotificationBell />}
            <CountrySelector />

            {!loading && (
              <div className="hidden md:flex items-center gap-2 ml-1">
                {user ? (
                  <>
                    {user.email === ADMIN_EMAIL && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="transition-colors hidden lg:inline-flex"
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#a1a1aa",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px 8px",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                      >
                        Admin
                      </button>
                    )}

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="transition-colors rounded-md"
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#e4e4e7",
                        background: "transparent",
                        border: "1px solid #27272a",
                        cursor: "pointer",
                        padding: "6px 12px",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#3f3f46";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#27272a";
                        e.currentTarget.style.color = "#e4e4e7";
                      }}
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={signOut}
                      className="transition-colors"
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#a1a1aa",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "6px 8px",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => navigate("/auth")} className="rounded-md btn-glow h-8">
                    Get Started
                  </Button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden flex items-center justify-center"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "white",
                padding: "8px",
                minWidth: "44px",
                minHeight: "44px",
              }}
              aria-label="Open navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 99998,
            }}
          />

          {/* Drawer — slides in from right */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "280px",
              backgroundColor: "#0f0f0f",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid #1f1f1f",
              }}
            >
              <span style={{ fontWeight: 900, fontSize: "18px", color: "white" }}>
                <span style={{ color: "#cc1111" }}>GO</span>PARTARA
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  padding: "8px",
                  fontSize: "20px",
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Links — grouped with section separators */}
            <div style={{ padding: "12px", flex: 1 }}>
              {[
                {
                  title: "Browse",
                  items: [
                    { label: "Home", href: "/", icon: "🏠" },
                    { label: "Search Parts", href: "/search", icon: "🔍" },
                    { label: "Tyres", href: "/tyres", icon: "tyre" },
                    { label: "Deals", href: "/deals", icon: "🔥" },
                    { label: "Marketplace", href: "/marketplace", icon: "🏪" },
                  ],
                },
                {
                  title: "Account",
                  items: [
                    { label: "Pricing", href: "/pricing", icon: "💰" },
                    { label: "Dashboard", href: "/dashboard", icon: "📊" },
                  ],
                },
                {
                  title: "Company",
                  items: [
                    { label: "Blog", href: "/blog", icon: "📝" },
                    { label: "For Business", href: "/business", icon: "🏢" },
                    { label: "Help Center", href: "/help", icon: "❓" },
                    { label: "About", href: "/about", icon: "ℹ️" },
                    { label: "Contact", href: "/contact", icon: "✉️" },
                  ],
                },
              ].map((section, sIdx) => (
                <div key={section.title} style={{ marginTop: sIdx === 0 ? 0 : 12 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#52525b",
                      padding: "8px 12px 6px",
                    }}
                  >
                    {section.title}
                  </div>
                  {section.items.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleMobileLinkClick(e, link.href)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "13px 12px",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: "15px",
                        fontWeight: 600,
                        borderRadius: "10px",
                        marginBottom: "2px",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {link.icon === "tyre" ? (
                        <img
                          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6de.png"
                          width={18}
                          height={18}
                          alt=""
                          loading="lazy"
                          style={{ display: "inline-block", verticalAlign: "middle" }}
                        />
                      ) : (
                        <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>
                          {link.icon}
                        </span>
                      )}
                      {link.label}
                    </a>
                  ))}
                  {sIdx < 2 && (
                    <div
                      style={{
                        height: "1px",
                        background: "#1f1f1f",
                        margin: "8px 12px 0",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div style={{ padding: "20px", borderTop: "1px solid #1a1a1a" }}>
              <a
                href="/sign-out"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  signOut();
                }}
                style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}
              >
                Sign Out →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
