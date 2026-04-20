import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import MessageBubble from "@/components/MessageBubble";
import CountrySelector from "@/components/CountrySelector";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "/pricing" },
];

const moreLinks = [
  { label: "Deals", href: "/deals" },
  { label: "Tyres", href: "/tyres" },
  { label: "For Business", href: "/business" },
  { label: "Compare", href: "/compare" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const ADMIN_EMAIL = "info@gopartara.com";

const Navbar = () => {
  const [open, setOpen] = useState(false);
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

  const handleMoreEnter = useCallback(() => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    setMoreOpen(true);
  }, []);

  const handleMoreLeave = useCallback(() => {
    moreTimeoutRef.current = setTimeout(() => setMoreOpen(false), 250);
  }, []);

  const handleNavClick = (href: string) => {
    setOpen(false);
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "glass-strong shadow-lg shadow-background/50"
        : "bg-transparent backdrop-blur-md border-b border-transparent"
    }`}>
      <div className="container flex h-16 items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.location.reload();
            }
          }}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              window.open('https://gopartara.com', '_blank');
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
            <span className="logo-part transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(0_85%_50%/0.6)]">PART</span>
            <span className="logo-ara">ARA</span>
          </span>
        </a>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-8">
            {primaryLinks.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.href)}
                className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {l.label}
              </button>
            ))}

            <div
              className="relative"
              onMouseEnter={handleMoreEnter}
              onMouseLeave={handleMoreLeave}
            >
              <button className="nav-link text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-1">
                More
                <ChevronDown size={14} className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} />
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

            {!loading && (
              user ? (
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
              )
            )}
          </div>

          <CountrySelector />
          {!loading && user && <MessageBubble />}
          {!loading && user && <NotificationBell />}

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass-strong border-t border-border/40 pb-4 safe-bottom">
          <div className="container flex flex-col gap-3 pt-3">
            {primaryLinks.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.href)}
                className="py-2.5 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}

            <div className="mt-1 border-t border-border/40 pt-2">
              <span className="block px-0 pb-1 text-xs uppercase tracking-wider text-muted-foreground">More</span>
              {moreLinks.map((l) => (
                <button
                  key={l.href}
                  onClick={() => handleNavClick(l.href)}
                  className="w-full py-2.5 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>

            {!loading && (
              user ? (
                <div className="mt-1 flex flex-col gap-2 border-t border-border/40 pt-2">
                  {user.email === ADMIN_EMAIL && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/admin");
                      }}
                      className="flex items-center gap-1.5 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Shield size={14} />
                      Admin
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/dashboard");
                    }}
                    className="flex items-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <User size={14} />
                    Dashboard
                  </button>

                  <Button size="sm" variant="outline" onClick={signOut} className="w-fit gap-1.5 rounded-xl">
                    <LogOut size={14} />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => {
                  setOpen(false);
                  navigate("/auth");
                }} className="w-fit rounded-xl btn-glow">
                  Get Started
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
