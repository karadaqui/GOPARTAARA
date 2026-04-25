import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CONSENT_KEY = "cookie_consent";
const LEGACY_KEY = "partara_cookie_consent";

const applyAnalytics = (accepted: boolean) => {
  if (typeof window !== "undefined") {
    (window as any)["ga-disable-G-YRZ3243HF0"] = !accepted;
    if (!accepted) {
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("_ga") || name.startsWith("_gid")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }
  }
};

const CookieConsent = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Don't show to logged-in users
    if (user) {
      setMounted(false);
      setVisible(false);
      return;
    }
    const stored = localStorage.getItem(CONSENT_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!stored) {
      (window as any)["ga-disable-G-YRZ3243HF0"] = true;
      // Show after a 2s delay to be less intrusive
      const showTimer = window.setTimeout(() => {
        setMounted(true);
        // Next tick: trigger the slide-up transition
        window.requestAnimationFrame(() => setVisible(true));
      }, 2000);
      return () => window.clearTimeout(showTimer);
    }
    const accepted = stored === "accepted" || stored.includes("\"analytics\":true");
    applyAnalytics(accepted);
  }, [user, loading]);

  const choose = (decision: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, decision);
    applyAnalytics(decision === "accepted");
    // Slide back down, then unmount
    setVisible(false);
    window.setTimeout(() => setMounted(false), 320);
  };

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: "rgba(17,17,17,0.92)",
        borderTop: "1px solid #1f1f1f",
        padding: "16px 24px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: 1.5 }}>
            🍪 We use cookies to improve your experience and analyse site traffic.
          </p>
          <p style={{ fontSize: "13px", color: "#71717a", marginTop: "4px" }}>
            Read our{" "}
            <Link to="/privacy" className="hover:underline" style={{ color: "#cc1111" }}>
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => choose("declined")}
            className="transition-colors hover:text-white"
            style={{
              border: "1px solid #27272a",
              background: "transparent",
              color: "#71717a",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="transition-opacity hover:opacity-90"
            style={{
              background: "#cc1111",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
