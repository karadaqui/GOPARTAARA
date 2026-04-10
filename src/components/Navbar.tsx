import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "/pricing" },
];

const moreLinks = [
  { label: "My Garage", href: "/garage" },
  { label: "My Market", href: "/my-market" },
  { label: "Saved Parts", href: "/saved" },
  { label: "List Your Parts", href: "/list-your-parts" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const ADMIN_EMAIL = "info@gopartara.com";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <button onClick={() => handleNavClick("/")} className="font-display text-2xl font-bold tracking-tight">
          <span className="text-primary">PART</span>
          <span className="text-foreground">ARA</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-8">
            {primaryLinks.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}

            <div
              className="relative"
              onMouseEnter={handleMoreEnter}
              onMouseLeave={handleMoreLeave}
            >
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                More
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              {moreOpen && (
                <div className="absolute top-full right-0 pt-2 w-48">
                  <div className="rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
                    {moreLinks.map((l) => (
                      <button
                        key={l.href}
                        onClick={() => handleNavClick(l.href)}
                        className="w-full rounded-sm px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <User size={14} />
                    Dashboard
                  </button>

                  <Button size="sm" variant="outline" onClick={signOut} className="gap-1.5">
                    <LogOut size={14} />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              )
            )}
          </div>

          {!loading && user && <NotificationBell />}

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-border pb-4">
          <div className="container flex flex-col gap-3 pt-3">
            {primaryLinks.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.href)}
                className="py-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}

            <div className="mt-1 border-t border-border pt-2">
              <span className="block px-0 pb-1 text-xs uppercase tracking-wider text-muted-foreground">More</span>
              {moreLinks.map((l) => (
                <button
                  key={l.href}
                  onClick={() => handleNavClick(l.href)}
                  className="w-full py-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>

            {!loading && (
              user ? (
                <div className="mt-1 flex flex-col gap-2 border-t border-border pt-2">
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

                  <Button size="sm" variant="outline" onClick={signOut} className="w-fit gap-1.5">
                    <LogOut size={14} />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => {
                  setOpen(false);
                  navigate("/auth");
                }} className="w-fit">
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
