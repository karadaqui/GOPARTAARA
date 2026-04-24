import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "exit_intent_shown";

const ExitIntentBanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Desktop only
    if (window.matchMedia("(max-width: 767px)").matches) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
    } catch {}

    const handleLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setVisible(true);
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {}
        document.removeEventListener("mouseleave", handleLeave);
      }
    };
    document.addEventListener("mouseleave", handleLeave);
    return () => document.removeEventListener("mouseleave", handleLeave);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9998] animate-fade-in"
      style={{
        bottom: 24,
        background: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        maxWidth: "calc(100vw - 32px)",
      }}
      role="dialog"
      aria-live="polite"
    >
      <span style={{ color: "#d4d4d8", fontSize: 14 }}>
        Before you go — search is completely free. No sign-up needed.
      </span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          navigate("/search");
        }}
        className="inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        style={{
          background: "#cc1111",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 600,
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Search Now <ArrowRight size={14} />
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        style={{
          background: "transparent",
          color: "#71717a",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "inline-flex",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ExitIntentBanner;
