import { useEffect, useState } from "react";

const STORAGE_KEY = "app_banner_dismissed";

const MobileAppBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setVisible(false);
  };

  const handleAdd = () => {
    // Best-effort: most browsers don't expose A2HS programmatically.
    // We surface short instructions via toast-like alert and dismiss.
    try {
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const msg = isIOS
        ? "Tap the Share icon in Safari, then 'Add to Home Screen'."
        : "Open your browser menu, then 'Add to Home screen'.";
      alert(msg);
    } catch {}
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="md:hidden"
      style={{
        background: "#111111",
        borderBottom: "1px solid #1f1f1f",
        height: 40,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "#cc1111",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          G
        </span>
        <span
          style={{
            color: "#a1a1aa",
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Get the best experience on mobile
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleAdd}
          style={{
            background: "#cc1111",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Add to Home Screen
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          style={{
            background: "transparent",
            color: "#71717a",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            padding: "4px 6px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MobileAppBanner;
