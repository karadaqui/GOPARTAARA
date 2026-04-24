import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate("/search");
  };

  return (
    <>
      <SEOHead
        title="Page Not Found | GOPARTARA"
        description="The page you're looking for doesn't exist. Head back to GOPARTARA to find any car part instantly."
        path={location.pathname}
      />
      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#080808" }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Soft red glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(204,17,17,0.10) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo */}
        <Link
          to="/"
          className="absolute top-8 left-8 z-10"
          style={{ fontSize: "20px" }}
        >
          <span className="logo-text">
            <span className="logo-go">GO</span>
            <span className="logo-part">PART</span>
            <span className="logo-ara">ARA</span>
          </span>
        </Link>

        <div className="relative z-10 w-full max-w-xl px-4 text-center">
          {/* Decorative 404 + overlay text */}
          <div className="relative" style={{ height: "180px" }}>
            <span
              className="font-display absolute inset-0 flex items-center justify-center select-none"
              style={{
                fontSize: "clamp(120px, 18vw, 180px)",
                fontWeight: 900,
                color: "rgba(204,17,17,0.15)",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              404
            </span>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(26px, 4vw, 32px)",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                Part not found.
              </h1>
              <p
                style={{
                  fontSize: "17px",
                  color: "#71717a",
                  marginTop: "8px",
                }}
              >
                Looks like this page drove off without us.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="relative w-full mt-10"
            style={{ maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}
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
              placeholder="Try searching for a car part instead..."
              className="w-full outline-none transition-colors"
              style={{
                height: "52px",
                paddingLeft: "44px",
                paddingRight: "16px",
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
          </form>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full sm:w-auto transition-opacity hover:opacity-90"
              style={{
                height: "44px",
                padding: "0 24px",
                background: "#cc1111",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
              }}
            >
              Go Home
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center w-full sm:w-auto transition-colors"
              style={{
                height: "44px",
                padding: "0 24px",
                background: "transparent",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                border: "1px solid #27272a",
              }}
            >
              Search Parts
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
