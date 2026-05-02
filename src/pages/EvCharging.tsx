import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

export default function EvCharging() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const list = JSON.parse(localStorage.getItem("ev_charging_notify_list") || "[]");
      if (!list.includes(trimmed)) list.push(trimmed);
      localStorage.setItem("ev_charging_notify_list", JSON.stringify(list));
      toast.success("You're on the list!", {
        description: "We'll email you when EV Charging launches.",
      });
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      <SEOHead
        title="EV Charging — Coming Soon | GOPARTARA"
        description="EV charging point data and EV-specific parts coming soon to GOPARTARA."
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl mx-auto text-center">
          <div className="text-6xl mb-6" aria-hidden="true">🔧</div>

          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
            style={{
              background: "rgba(204,17,17,0.12)",
              border: "1px solid rgba(204,17,17,0.4)",
              color: "#ff5252",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            🔧 Under Development
          </span>

          <h1
            className="font-display tracking-tight mb-4"
            style={{ color: "#ffffff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800 }}
          >
            EV Charging — Coming Soon
          </h1>

          <p
            className="mb-10 mx-auto"
            style={{ color: "#a1a1aa", fontSize: 16, lineHeight: 1.6, maxWidth: 480 }}
          >
            We're integrating EV charging point data and EV-specific parts. Check back soon.
          </p>

          <form
            onSubmit={handleNotify}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-label="Email address"
              className="flex-1 outline-none"
              style={{
                background: "#111111",
                border: "1px solid #27272a",
                color: "#ffffff",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                background: "#cc1111",
                color: "#ffffff",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Notify Me →
            </button>
          </form>

          <p className="mt-4" style={{ color: "#71717a", fontSize: 13 }}>
            Be the first to know when EV Charging goes live.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
