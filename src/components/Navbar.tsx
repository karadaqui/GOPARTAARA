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
  Scale,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
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
  elite?: boolean;
};

const moreLinks: MoreLink[] = [
  { label: "EV Charging", href: "/ev-charging", Icon: Zap },
  { label: "Bulk Compare", href: "/compare", Icon: Scale, elite: true },
  { label: "Tyres", href: "/tyres", Icon: CircleDot },
  { label: "For Business", href: "/business", Icon: Briefcase },
  { label: "Blog", href: "/blog", Icon: BookOpen },
  { label: "Help Center", href: "/help", Icon: HelpCircle },
  { label: "About", href: "/about", Icon: Info },
  { label: "Contact", href: "/contact", Icon: MailIcon },
];

const authedMoreLink: MoreLink = { label: "My Shop", href: "/my-market", Icon: Briefcase };

const ADMIN_EMAIL = "info@gopartara.com";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut, loading } = useAuth();
  const { isElite, isAdmin } = useUserPlan();
  const eliteAccess = isElite || isAdmin;
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

  const NAV_MUTED = "#64748b";
  const NAV_ACTIVE = "#0a1628";

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          willChange: "transform",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: scrolled ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
          transition: "box-shadow 200ms ease",
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
              <span className="logo-part">PART</span>
              <span className="logo-ara">ARA</span>
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
                  style={{
                    fontSize: "14px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? NAV_ACTIVE : NAV_MUTED,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = NAV_ACTIVE;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = NAV_MUTED;
                  }}
                >
                  {l.label}
                </button>
              );
            })}

            <div className="relative" onMouseEnter={handleMoreEnter} onMouseLeave={handleMoreLeave}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "14px",
                  lineHeight: 1,
                  fontWeight: 500,
                  color: NAV_MUTED,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = NAV_ACTIVE)}
                onMouseLeave={(e) => (e.currentTarget.style.color = NAV_MUTED)}
              >
                <span style={{ display: "block", lineHeight: "14px" }}>More</span>
                <ChevronDown
                  size={13}
                  style={{ display: "block", flexShrink: 0 }}
                  className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52">
                  <div
                    className="rounded-lg p-1 animate-in fade-in-0 zoom-in-95"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                    }}
                  >
                    {(user ? [moreLinks[0], authedMoreLink, ...moreLinks.slice(1)] : moreLinks).map((l) => {
                      const isActive =
                        pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                      const Icon = l.Icon;
                      const showEliteBadge = l.elite && !eliteAccess;
                      return (
                        <button
                          key={l.href}
                          onClick={() => handleNavClick(l.href)}
                          className="w-full rounded-md px-3 py-2 text-left flex items-center gap-2.5"
                          style={{
                            fontSize: "13px",
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? NAV_ACTIVE : NAV_MUTED,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = NAV_ACTIVE;
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.color = NAV_MUTED;
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Icon size={14} className="opacity-70" />
                          <span className="flex-1">{l.label}</span>
                          {showEliteBadge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "#92400e",
                                background: "#fef3c7",
                                border: "1px solid #fcd34d",
                                padding: "2px 6px",
                                borderRadius: 999,
                              }}
                            >
                              Elite
                            </span>
                          )}
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
            {/* Live pill */}
            <span
              className="hidden sm:inline-flex items-center"
              style={{
                gap: 6,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                fontWeight: 700,
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              <span className="live-dot" />
              7 live
            </span>

            <div className="hidden md:flex items-center gap-2">
              {!loading && user && <MessageBubble />}
              {!loading && user && <NotificationBell />}
              <CountrySelector />
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-2 ml-1">
                {user ? (
                  <>
                    {user.email === ADMIN_EMAIL && (
                      <>
                        <button
                          onClick={() => navigate("/admin")}
                          className="hidden lg:inline-flex"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: NAV_MUTED,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "6px 8px",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = NAV_ACTIVE)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = NAV_MUTED)}
                        >
                          Admin
                        </button>
                        <button
                          onClick={() => navigate("/admin/sales")}
                          className="hidden lg:inline-flex"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: NAV_MUTED,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "6px 8px",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = NAV_ACTIVE)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = NAV_MUTED)}
                        >
                          Sales
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="btn-navy"
                      style={{
                        fontSize: 13,
                        padding: "7px 14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={signOut}
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: NAV_MUTED,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "6px 8px",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = NAV_ACTIVE)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = NAV_MUTED)}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="btn-navy"
                    style={{ fontSize: 13, padding: "7px 14px", whiteSpace: "nowrap" }}
                  >
                    Get Started
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden flex items-center justify-center"
              style={{
                width: "40px",
                height: "40px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#0f172a",
              }}
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: "#ffffff",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            animation: "slideInRight 0.3s ease",
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>

          {/* Top row: logo + close */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <a
              href="/"
              onClick={(e) => handleMobileLinkClick(e, "/")}
              className="no-underline"
            >
              <span className="logo-text text-xl">
                <span className="logo-go">GO</span>
                <span className="logo-part">PART</span>
                <span className="logo-ara">ARA</span>
              </span>
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
              style={{
                width: "40px",
                height: "40px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#0f172a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, marginTop: "8px" }}>
            {[
              { label: "Search", href: "/search" },
              { label: "Marketplace", href: "/marketplace" },
              ...(user ? [{ label: "My Shop", href: "/my-market" }] : []),
              { label: "Deals", href: "/deals" },
              { label: "Pricing", href: "/pricing" },
              { label: "Help Center", href: "/help" },
              { label: "About", href: "/about" },
              { label: "Blog", href: "/blog" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleMobileLinkClick(e, link.href)}
                style={{
                  display: "block",
                  padding: "18px 0",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#0f172a",
                  borderBottom: "1px solid #f1f5f9",
                  textDecoration: "none",
                  letterSpacing: "-0.5px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Bottom buttons */}
          <div style={{ marginTop: "auto", paddingTop: "24px" }}>
            {user ? (
              <>
                <a
                  href="/dashboard"
                  onClick={(e) => handleMobileLinkClick(e, "/dashboard")}
                  className="btn-navy"
                  style={{
                    display: "block",
                    padding: "14px",
                    fontSize: "15px",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  Dashboard
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  style={{
                    display: "block",
                    background: "transparent",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    width: "100%",
                    marginTop: "12px",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a
                  href="/auth"
                  onClick={(e) => handleMobileLinkClick(e, "/auth")}
                  style={{
                    display: "block",
                    background: "transparent",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  Sign In
                </a>
                <a
                  href="/auth"
                  onClick={(e) => handleMobileLinkClick(e, "/auth")}
                  className="btn-navy"
                  style={{
                    display: "block",
                    padding: "14px",
                    fontSize: "15px",
                    width: "100%",
                    marginTop: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  Start for Free →
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
