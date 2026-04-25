import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(CONSENT_KEY) || localStorage.getItem(LEGACY_KEY);
    if (stored) {
      const accepted = stored === "accepted" || stored.includes('"analytics":true');
      applyAnalytics(accepted);
      return;
    }

    // Default: disable analytics until user consents
    (window as any)["ga-disable-G-YRZ3243HF0"] = true;

    const showTimer = window.setTimeout(() => {
      setMounted(true);
      window.requestAnimationFrame(() => setVisible(true));
    }, 2000);

    return () => window.clearTimeout(showTimer);
  }, []);

  const choose = (decision: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, decision);
    applyAnalytics(decision === "accepted");
    setVisible(false);
    window.setTimeout(() => setMounted(false), 320);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed left-0 right-0 bottom-0"
      style={{
        zIndex: 9999,
        background: "rgba(17,17,17,0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: "1px solid #1f1f1f",
        padding: "16px 24px",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
      }}
    >
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ maxWidth: 1440, margin: "0 auto" }}
      >
        <p className="leading-relaxed" style={{ fontSize: 14, color: "#a1a1aa" }}>
          🍪 We use cookies to improve your experience.{" "}
          <Link to="/privacy" className="hover:underline" style={{ color: "#cc1111" }}>
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => choose("declined")}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:text-white"
            style={{ border: "1px solid #27272a", background: "transparent", color: "#71717a" }}
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="px-4 py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "#cc1111", fontWeight: 600 }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
