import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Mail, Bike, Sparkles } from "lucide-react";

const RED = "#cc1111";

const MotorParts = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // UI only — no backend wired.
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SEOHead
        title="Motor Parts & Accessories — Coming Soon | GoPartara"
        description="Motorcycle parts, gear and accessories search — launching soon. Be the first to know when GoPartara Motor Parts goes live."
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase"
              style={{
                background: "rgba(204,17,17,0.1)",
                color: RED,
                border: "1px solid rgba(204,17,17,0.3)",
              }}
            >
              <Bike size={12} /> Motor Parts
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center font-bold tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}>
            Motor Parts & Accessories
          </h1>
          <p className="text-center text-zinc-400 mt-4 max-w-2xl mx-auto"
             style={{ fontSize: "17px", lineHeight: 1.65 }}>
            Your one-stop destination for motorcycle parts, gear and accessories.
            Launching soon.
          </p>

          {/* Coming Soon hero */}
          <section className="mt-12 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-8 sm:p-12 text-center">
            <Sparkles className="mx-auto mb-4" size={32} style={{ color: RED }} />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">COMING SOON</h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8">
              We're building the best motorcycle parts comparison engine in
              Europe. Drop your email and we'll let you know the moment it's live.
            </p>

            <form onSubmit={handleNotify} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-semibold text-white transition-colors"
                style={{ background: RED }}
              >
                Notify Me
              </button>
            </form>
            {submitted && (
              <p className="mt-3 text-sm text-emerald-400">
                Thanks — we'll be in touch when we launch.
              </p>
            )}
          </section>

          {/* Supplier preview */}
          <section className="mt-16">
            <h3 className="text-lg font-semibold mb-4 text-zinc-300">
              First confirmed supplier
            </h3>
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 flex items-center gap-4 opacity-70">
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                🇩🇪
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-lg">Polo-motorrad</h4>
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(161,161,170,0.15)",
                      color: "#a1a1aa",
                      border: "1px solid rgba(161,161,170,0.25)",
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  Europe's leading motorcycle parts & accessories retailer.
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-zinc-500 mt-8">
              We're onboarding more motorcycle suppliers. Stay tuned.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MotorParts;
