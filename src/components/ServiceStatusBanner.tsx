import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "ebay_status_dismissed";

const ServiceStatusBanner = () => {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  if (pathname !== "/search" || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      style={{
        background: "#1a1100",
        borderBottom: "1px solid #3d2e00",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        position: "relative",
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span
        style={{
          fontSize: 13,
          color: "#f5c842",
          textAlign: "center",
        }}
      >
        eBay search is currently experiencing intermittent issues on their end.
        Our team is monitoring the situation — results will load automatically
        once eBay restores service.
      </span>
      <span
        style={{
          background: "rgba(245, 200, 66, 0.15)",
          border: "1px solid rgba(245, 200, 66, 0.3)",
          color: "#f5c842",
          padding: "2px 10px",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        eBay Status: Degraded
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleDismiss}
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          background: "transparent",
          border: "none",
          color: "#f5c842",
          cursor: "pointer",
          padding: 4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ServiceStatusBanner;
