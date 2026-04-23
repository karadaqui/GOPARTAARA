import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import MessageBubble from "@/components/MessageBubble";
import CountrySelector from "@/components/CountrySelector";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Deals", href: "/deals" },
  { label: "Pricing", href: "/pricing" },
];

const moreLinks = [
  { label: "Tyres", href: "/tyres" },
  { label: "For Business", href: "/business" },
  { label: "Compare", href: "/compare" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const mobileLinks = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Search Parts", href: "/", icon: "🔍" },
  { label: "Tyres", href: "/tyres", icon: "🛞" },
  { label: "Deals", href: "/deals", icon: "🔥" },
  { label: "Marketplace", href: "/marketplace", icon: "🏪" },
  { label: "Pricing", href: "/pricing", icon: "💰" },
  { label: "Blog", href: "/blog", icon: "📝" },
  { label: "For Business", href: "/business", icon: "🏢" },
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
];

const ADMIN_EMAIL = "info@gopartara.com";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
      if (location.pathname === "/") {
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
    if (href === "/" && location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-lg shadow-background/50"
            : "bg-transparent backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
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
            className="no-underline group"
          >
            <span className="logo-text text-2xl">
              <span className="logo-go">GO</span>
              <span className="logo-part transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(0_85%_50%/0.6)]">
                PART
              </span>
              <span className="logo-ara">ARA</span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-8">
              {primaryLinks.map((l) => {
                const isActive =
                  l.href === "/"
                    ? location.pathname === "/" && l.label === "Home"
                    : location.pathname === l.href || location.pathname.startsWith(l.href + "/");
                return (
                  <button
                    key={l.label}
                    onClick={() => handleNavClick(l.href)}
                    className={`nav-link text-sm transition-colors py-1 ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}

              <div className="relative" onMouseEnter={handleMoreEnter} onMouseLeave={handleMoreLeave}>
                <button className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-1">
                  More
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreOpen && (
                  <div className="absolute top-full right-0 pt-2 w-48">
                    <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl p-1.5 shadow-xl shadow-background/40 animate-in fade-in-0 zoom-in-95">
                      {moreLinks.map((l) => (
                        <button
                          key={l.href}
                          onClick={() => handleNavClick(l.href)}
                          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent/10 hover:text-accent-foreground"
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!loading &&
                (user ? (
                  <div className="flex items-center gap-3">
                    {user.email === ADMIN_EMAIL && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-medium"
                      >
                        <Shield size={14} />
                        Admin
                      </button>
                    )}

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 py-1"
                    >
                      <User size={14} />
                      Dashboard
                    </button>

                    <Button size="sm" variant="outline" onClick={signOut} className="gap-1.5 rounded-xl">
                      <LogOut size={14} />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => navigate("/auth")} className="rounded-xl btn-glow">
                    Get Started
                  </Button>
                ))}
            </div>

            <CountrySelector />
            {!loading && user && <MessageBubble />}
            {!loading && user && <NotificationBell />}

            {/* Hamburger button - mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                minWidth: "44px",
                minHeight: "44px",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ display: "block", width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
              <span style={{ display: "block", width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
              <span style={{ display: "block", width: "22px", height: "2px", background: "white", borderRadius: "2px" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen menu - inline styles for maximum reliability */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#0a0a0a",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: "20px", letterSpacing: "-0.02em" }}>
              <span style={{ color: "#ffffff" }}>GO</span>
              <span style={{ color: "#cc1111" }}>PART</span>
              <span style={{ color: "#ffffff" }}>ARA</span>
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "8px",
                fontSize: "24px",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              ✕
            </button>
          </div>

          {/* Links */}
          <div style={{ flex: 1, padding: "8px 20px" }}>
            {mobileLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleMobileLinkClick(e, link.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 12px",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "17px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1a1a1a",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "56px",
                }}
              >
                <span style={{ fontSize: "20px" }}>{link.icon}</span>
                {link.label}
              </a>
            ))}

            {!loading && user && user.email === ADMIN_EMAIL && (
              <a
                href="/admin"
                onClick={(e) => handleMobileLinkClick(e, "/admin")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 12px",
                  color: "#ff4444",
                  textDecoration: "none",
                  fontSize: "17px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1a1a1a",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "56px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🛡️</span>
                Admin
              </a>
            )}
          </div>

          {/* Bottom */}
          <div style={{ padding: "20px", borderTop: "1px solid #1a1a1a" }}>
            {!loading && user ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888888",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "8px 0",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Sign Out →
              </button>
            ) : (
              <a
                href="/auth"
                onClick={(e) => handleMobileLinkClick(e, "/auth")}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px",
                  background: "#cc1111",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Get Started
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
