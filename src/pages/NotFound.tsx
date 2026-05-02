import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, Home, Tag } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("brake pads");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <>
      <SEOHead
        title="Page Not Found | GOPARTARA"
        description="The page you're looking for doesn't exist. Head back to GOPARTARA to find any car part instantly."
        path={location.pathname}
      />
      <div className="min-h-screen flex flex-col" style={{ background: "#080808" }}>
        <Navbar />

        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 py-16">
          {/* dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* red glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "25%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(204,17,17,0.12) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          <div className="relative z-10 w-full max-w-xl text-center">
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(110px, 18vw, 180px)",
                fontWeight: 900,
                color: "#cc1111",
                letterSpacing: "-0.05em",
                lineHeight: 1,
                textShadow: "0 4px 40px rgba(204,17,17,0.4)",
              }}
            >
              404
            </h1>

            <h2
              className="font-display mt-4"
              style={{
                fontSize: "clamp(24px, 4vw, 32px)",
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              Oops! Page not found.
            </h2>
            <p style={{ fontSize: "16px", color: "#a1a1aa", marginTop: "10px" }}>
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="relative w-full mt-8 mx-auto"
              style={{ maxWidth: "520px" }}
            >
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "#52525b" }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a car part..."
                className="w-full outline-none transition-colors"
                style={{
                  height: "52px",
                  paddingLeft: "44px",
                  paddingRight: "100px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid #27272a",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "14px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(204,17,17,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(204,17,17,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#27272a";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-90"
                style={{
                  height: "40px",
                  padding: "0 16px",
                  background: "#cc1111",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                }}
              >
                Search
              </button>
            </form>

            {/* Quick links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto transition-opacity hover:opacity-90"
                style={{
                  height: "44px",
                  padding: "0 20px",
                  background: "#cc1111",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                }}
              >
                <Home size={16} /> Go Home
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto transition-colors hover:bg-white/5"
                style={{
                  height: "44px",
                  padding: "0 20px",
                  background: "transparent",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "1px solid #27272a",
                }}
              >
                <Search size={16} /> Search Parts
              </Link>
              <Link
                to="/deals"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto transition-colors hover:bg-white/5"
                style={{
                  height: "44px",
                  padding: "0 20px",
                  background: "transparent",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "1px solid #27272a",
                }}
              >
                <Tag size={16} /> View Deals
              </Link>
            </div>

            <p
              className="mt-8 mx-auto"
              style={{
                fontSize: "13px",
                color: "#71717a",
                fontStyle: "italic",
                maxWidth: "440px",
              }}
            >
              🔧 Even our search engine couldn't find this page... but it found 1,000,000+ car parts!
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
