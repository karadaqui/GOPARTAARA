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
  const [visible, setVisible] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Don't show to logged-in users
    if (user) {
      setVisible(false);
      return;
    }
    const stored = localStorage.getItem(CONSENT_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!stored) {
      (window as any)["ga-disable-G-YRZ3243HF0"] = true;
      setVisible(true);
    } else {
      const accepted = stored === "accepted" || stored.includes("\"analytics\":true");
      applyAnalytics(accepted);
    }
  }, [user, loading]);

  const choose = (decision: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, decision);
    applyAnalytics(decision === "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100]"
      style={{
        background: "#111111",
        borderTop: "1px solid #1f1f1f",
        padding: "16px 24px",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-300 leading-relaxed">
          We use cookies to improve your experience.{" "}
          <Link to="/privacy" className="hover:underline" style={{ color: "#cc1111" }}>
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => choose("declined")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            style={{ border: "1px solid #27272a", background: "transparent" }}
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#cc1111" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
