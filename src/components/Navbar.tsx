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
  { label: "Bulk Compare", href: "/compare", Icon: Scale, elite: true },
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
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52">
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
                      const showEliteBadge = l.elite && !eliteAccess;
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
                          <span className="flex-1">{l.label}</span>
                          {showEliteBadge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "#fbbf24",
                                background: "rgba(251,191,36,0.12)",
                                border: "1px solid rgba(251,191,36,0.25)",
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
                        <button
                          onClick={() => navigate("/admin/sales")}
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
                          Sales
                        </button>
                      </>
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
                width: "40px",
                height: "40px",
                background: "transparent",
                border: "1px solid #27272a",
                borderRadius: "8px",
                cursor: "pointer",
                color: "white",
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
            backgroundColor: "#080808",
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
                <span className="logo-part">PARTARA</span>
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
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "white",
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
                  color: "white",
                  borderBottom: "1px solid #111111",
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
                  style={{
                    display: "block",
                    background: "transparent",
                    border: "1px solid #27272a",
                    color: "white",
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
                    background: "#cc1111",
                    border: "none",
                    color: "white",
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
                    border: "1px solid #27272a",
                    color: "white",
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
                  style={{
                    display: "block",
                    background: "#cc1111",
                    border: "none",
                    color: "white",
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
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
