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
  { label: "Search", href: "/search" },
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
  const { pathname } = useLocation();

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
        className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
          scrolled
            ? "glass-strong shadow-lg shadow-background/50"
            : "bg-transparent backdrop-blur-md border-b border-transparent"
        }`}
        style={{ WebkitTransform: "translateZ(0)", transform: "translateZ(0)", willChange: "transform" }}
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
              <span className="logo-part transition-colors group-hover:drop-shadow-[0_0_8px_hsl(0_85%_50%/0.6)]">
                PART
              </span>
              <span className="logo-ara">ARA</span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-8">
              {primaryLinks.map((l) => {
                const isActive =
                  pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                return (
                  <button
                    key={l.label}
                    onClick={() => handleNavClick(l.href)}
                    className={`nav-link text-sm py-1 transition-colors ${
                      isActive ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
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
                      {moreLinks.map((l) => {
                        const isActive = pathname === l.href;
                        return (
                          <button
                            key={l.href}
                            onClick={() => handleNavClick(l.href)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                              isActive
                                ? "text-white font-semibold"
                                : "text-zinc-400 hover:bg-accent/10 hover:text-white"
                            }`}
                          >
                            {l.label}
                          </button>
                        );
                      })}
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

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "white",
                padding: "8px",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#0f0f0f",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #1f1f1f",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: "20px", color: "white" }}>
              <span style={{ color: "#cc1111" }}>GO</span>PARTARA
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "8px",
                fontSize: "22px",
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

          <div style={{ padding: "8px 16px", flex: 1 }}>
            {[
              { label: "🏠 Home", href: "/" },
              { label: "🔍 Search Parts", href: "/search" },
              { label: "🛞 Tyres", href: "/tyres" },
              { label: "🔥 Deals", href: "/deals" },
              { label: "🏪 Marketplace", href: "/marketplace" },
              { label: "💰 Pricing", href: "/pricing" },
              { label: "📝 Blog", href: "/blog" },
              { label: "🏢 For Business", href: "/business" },
              { label: "📊 Dashboard", href: "/dashboard" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleMobileLinkClick(e, link.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 8px",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "17px",
                  fontWeight: 600,
                  borderBottom: "1px solid #1a1a1a",
                  minHeight: "56px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ padding: "20px", borderTop: "1px solid #1a1a1a" }}>
            <a
              href="/sign-out"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                signOut();
              }}
              style={{ color: "#666", fontSize: "14px", textDecoration: "none" }}
            >
              Sign Out →
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
