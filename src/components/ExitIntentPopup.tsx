import { useEffect, useState, FormEvent } from "react";
import { X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/sanitize";

const STORAGE_KEY = "exit_intent_popup_shown";
const MOBILE_DELAY_MS = 30_000;

const ExitIntentPopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true") return;
    } catch {}

    const markShown = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {}
    };

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      const t = window.setTimeout(() => {
        setVisible(true);
        markShown();
      }, MOBILE_DELAY_MS);
      return () => window.clearTimeout(t);
    }

    const handleLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setVisible(true);
        markShown();
        document.removeEventListener("mouseleave", handleLeave);
      }
    };
    document.addEventListener("mouseleave", handleLeave);
    return () => document.removeEventListener("mouseleave", handleLeave);
  }, []);

  // Esc to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const close = () => setVisible(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("newsletter_subscribers" as any).insert({ email: trimmed });
    } catch {
      // silent — non-critical
    } finally {
      setSubmitting(false);
      toast.success("You're in! We'll send free price alerts.");
      close();
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-popup-title"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111111",
          border: "1px solid #1f1f1f",
          borderRadius: 12,
          maxWidth: 480,
          width: "100%",
          padding: "32px 28px 28px",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: "#a1a1aa",
            cursor: "pointer",
            padding: 6,
            display: "inline-flex",
          }}
        >
          <X size={20} />
        </button>

        <h2
          id="exit-popup-title"
          style={{
            color: "#fafafa",
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            marginBottom: 8,
            lineHeight: 1.25,
          }}
        >
          Wait — don't leave empty handed! 🎉
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: 14, margin: 0, marginBottom: 18 }}>
          Search 1,000,000+ parts for free before you go
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
            style={{
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              color: "#fafafa",
              fontSize: 14,
              padding: "11px 14px",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{
              background: "#cc1111",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "11px 16px",
              borderRadius: 8,
              border: "none",
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : (
              <>
                Get free price alerts <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p style={{ color: "#71717a", fontSize: 12, margin: 0, marginTop: 12, textAlign: "center" }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
