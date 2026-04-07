import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/#search" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/", { state: { scrollTo: id } });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex items-center justify-between h-16">
        <button onClick={() => handleNavClick("/")} className="font-display text-2xl font-bold tracking-tight">
          <span className="text-primary">PART</span>
          <span className="text-foreground">ARA</span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => handleNavClick(l.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </button>
          ))}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/saved")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Bookmark size={14} />
                  Saved Parts
                </button>
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

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-border pb-4">
          <div className="container flex flex-col gap-3 pt-3">
            {navLinks.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNavClick(l.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left"
              >
                {l.label}
              </button>
            ))}
            {!loading && (
              user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setOpen(false); navigate("/saved"); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 py-2"
                  >
                    <Bookmark size={14} />
                    Saved Parts
                  </button>
                  <button
                    onClick={() => { setOpen(false); navigate("/dashboard"); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 py-2"
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
                <Button size="sm" onClick={() => { setOpen(false); navigate("/auth"); }} className="w-fit">
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
