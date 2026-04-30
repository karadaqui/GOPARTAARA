import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export type Testimonial = {
  name: string;
  location: string;
  countryBadge: string;
  countryFlag?: string;
  rating: number;
  text: string;
  saving?: string;
};

/* ── Full pool — kept for Pricing page ── */
export const testimonials: Testimonial[] = [
  { name: "James T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "GOPARTARA saved me £40 on my BMW's brake pads. Found the same part cheaper than my local garage quoted. Unbelievable." },
  { name: "Sarah M.", location: "Manchester, UK", countryBadge: "UK", rating: 5, text: "The photo search is incredible. I had no idea what a part was called, took a photo and found it in seconds." },
  { name: "Mike R.", location: "Birmingham, UK", countryBadge: "UK", rating: 4, text: "As a DIY mechanic I use GOPARTARA every week. It's become my go-to before buying any part." },
  { name: "David W.", location: "Glasgow, UK", countryBadge: "UK", rating: 4, text: "The marketplace is great for finding secondhand parts locally. Listed my old parts and sold them within 3 days." },
  { name: "Roisin M.", location: "Dublin, Ireland", countryBadge: "IE", rating: 4, text: "Price alert saved me £22 on oil filters. Would recommend to anyone who buys parts regularly." },
  { name: "Gary T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "I'm a mechanic. This saves our workshop serious money on parts every week." },
];

const STATS = [
  { value: "1M+", label: "Parts compared" },
  { value: "£43", label: "Avg saving" },
  { value: "7", label: "Trusted suppliers" },
];

const REVIEWS: Testimonial[] = [
  {
    name: "James T.", location: "Leeds, UK", countryBadge: "UK", rating: 5,
    saving: "Saved £38",
    text: "Found the same brake pads for £38 less than the garage quoted me. Took 30 seconds.",
  },
  {
    name: "Roisin M.", location: "Dublin, Ireland", countryBadge: "IE", rating: 4,
    saving: "Saved £22",
    text: "Price alert saved me £22 on oil filters. Would recommend to anyone who buys parts regularly.",
  },
  {
    name: "Gary T.", location: "Leeds, UK", countryBadge: "UK", rating: 5,
    saving: "Saves weekly",
    text: "I'm a mechanic. This saves our workshop serious money on parts every week.",
  },
];

/* Card used by Pricing page (kept for compatibility) */
export const TestimonialCard = ({ t }: { t: Testimonial }) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "20px 24px",
    }}
  >
    <div className="flex items-center gap-0.5 mb-2" aria-label={`${t.rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= t.rating ? "fill-current" : ""}
          style={{ color: star <= t.rating ? "#fbbf24" : "#cbd5e1" }}
        />
      ))}
    </div>
    <p style={{ fontSize: 14, color: "#334155", fontStyle: "italic", lineHeight: 1.6 }}>
      "{t.text}"
    </p>
    <p style={{ fontSize: 12, color: "#64748b", marginTop: 12 }}>
      <span style={{ fontWeight: 700, color: "#0f172a" }}>{t.name}</span>
      {" "}— {t.location}
    </p>
  </div>
);

const TestimonialsSection = () => {
  return (
    <section style={{ background: "#0a1628", padding: "48px 16px" }}>
      <ScrollReveal className="text-center max-w-4xl mx-auto mb-6">
        <h2
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.01em",
          }}
        >
          Trusted by drivers & mechanics worldwide.
        </h2>
        <p style={{ color: "#93c5fd", fontSize: 13, marginTop: 8 }}>
          Early access · Real beta feedback
        </p>
      </ScrollReveal>

      {/* Stat cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3 mb-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 10,
              padding: "14px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", lineHeight: 1.1 }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#93c5fd",
                marginTop: 4,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Review cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
        {REVIEWS.map((t) => (
          <div
            key={t.name}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div className="flex items-center gap-0.5 mb-2" aria-label={`${t.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  className={star <= t.rating ? "fill-current" : ""}
                  style={{ color: star <= t.rating ? "#fbbf24" : "rgba(255,255,255,0.18)" }}
                />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#bfdbfe", fontStyle: "italic", lineHeight: 1.55 }}>
              "{t.text}"
            </p>
            {t.saving && (
              <p style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", marginTop: 10 }}>
                💰 {t.saving}
              </p>
            )}
            <p style={{ fontSize: 12, marginTop: 8 }}>
              <span style={{ color: "#ffffff", fontWeight: 700 }}>{t.name}</span>
              <span style={{ color: "#64748b" }}> — {t.location}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <a
          href="mailto:info@gopartara.com?subject=Feedback"
          style={{ color: "#93c5fd", fontSize: 12 }}
        >
          Have feedback? Share your experience →
        </a>
      </div>
    </section>
  );
};

export default TestimonialsSection;
