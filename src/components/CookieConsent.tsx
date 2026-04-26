import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "gopartara_cookie_consent";
const LEGACY_KEYS = ["cookie_consent", "partara_cookie_consent"];

const applyAnalytics = (accepted: boolean) => {
  if (typeof window === "undefined") return;
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
};

const readStoredConsent = (): string | null => {
  if (typeof window === "undefined") return null;
  const current = localStorage.getItem(CONSENT_KEY);
  if (current) return current;
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return null;
};

const CookieConsent = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = readStoredConsent();
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
    }, 1000);

    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const choose = (decision: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, decision);
    applyAnalytics(decision === "accepted");
    setVisible(false);
    window.setTimeout(() => setMounted(false), 300);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "#111111",
        borderTop: "1px solid #1f1f1f",
        padding: isMobile ? "16px 20px" : "20px 40px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: isMobile ? "16px" : "24px",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: visible ? "transform 0.3s ease-out" : "transform 0.3s ease-in",
      }}
    >
      <div style={{ maxWidth: 700 }}>
        <p style={{ color: "white", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
          🍪 We use cookies
        </p>
        <p style={{ color: "#71717a", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          We use essential cookies to make our site work. We'd also like to set optional analytics
          cookies to help us improve it. See our{" "}
          <Link to="/privacy" style={{ color: "#cc1111", textDecoration: "underline" }}>
            Cookie Policy
          </Link>{" "}
          for details.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          flexShrink: 0,
          width: isMobile ? "100%" : "auto",
        }}
      >
        <button
          onClick={() => choose("rejected")}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3f3f46";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#27272a";
            e.currentTarget.style.color = "#a1a1aa";
          }}
          style={{
            background: "transparent",
            border: "1px solid #27272a",
            color: "#a1a1aa",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            flex: isMobile ? 1 : "initial",
          }}
        >
          Reject Non-Essential
        </button>
        <button
          onClick={() => choose("accepted")}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e01111";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#cc1111";
          }}
          style={{
            background: "#cc1111",
            border: "none",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            flex: isMobile ? 1 : "initial",
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
