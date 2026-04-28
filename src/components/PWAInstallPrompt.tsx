import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_KEY = "pwa_visit_count";
const DISMISSED_KEY = "pwa_bottom_dismissed";
const SHOW_DELAY_MS = 30_000;
const MIN_VISITS = 3;

const PWAInstallPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Track visit count once per session
  useEffect(() => {
    try {
      const sessionFlag = sessionStorage.getItem("pwa_visit_counted");
      if (!sessionFlag) {
        const current = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);
        localStorage.setItem(VISIT_KEY, String(current + 1));
        sessionStorage.setItem("pwa_visit_counted", "1");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    // Don't show inside iframes (Lovable preview, etc.)
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    if (inIframe) return;

    // Already installed?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone === true;
    if (standalone) return;

    // Mobile only
    if (window.innerWidth >= 768) return;

    // Dismissed previously (persistent)
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "true") return;
    } catch {
      // ignore
    }

    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    let timer: number | undefined;
    if (visits >= MIN_VISITS) {
      setVisible(true);
    } else {
      timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {
        // ignore
      }
      setDeferredPrompt(null);
      dismiss();
      return;
    }
    // iOS: no programmatic install — keep banner with hint
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      alert(
        'To install: tap the Share icon, then "Add to Home Screen".'
      );
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
      style={{
        background: "#111111",
        borderTop: "1px solid #1f1f1f",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      role="dialog"
      aria-label="Install GOPARTARA"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          aria-hidden="true"
          style={{
            background: "#cc1111",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: 11,
            padding: "4px 6px",
            borderRadius: 4,
            letterSpacing: "-0.5px",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          GO
        </div>
        <p className="flex-1 text-[13px] leading-snug text-zinc-300">
          Add to home screen for faster access
        </p>
        <button
          type="button"
          onClick={install}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white"
          style={{ background: "#cc1111" }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex items-center justify-center"
          style={{
            minWidth: 44,
            minHeight: 44,
            color: "#71717a",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            padding: 8,
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
