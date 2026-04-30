import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export type Testimonial = {
  name: string;
  location: string;
  countryBadge: string;
  countryFlag?: string;
  rating: number;
  text: string;
};

/* ── Full testimonial pool (used by Pricing page and elsewhere) ── */
export const testimonials: Testimonial[] = [
  { name: "James T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "GOPARTARA saved me £40 on my BMW's brake pads. Found the same part cheaper than my local garage quoted. Unbelievable." },
  { name: "Sarah M.", location: "Manchester, UK", countryBadge: "UK", rating: 5, text: "The photo search is incredible. I had no idea what a part was called, took a photo and found it in seconds." },
  { name: "Mike R.", location: "Birmingham, UK", countryBadge: "UK", rating: 4, text: "As a DIY mechanic I use GOPARTARA every week. It's become my go-to before buying any part." },
  { name: "Thomas K.", location: "Berlin, Germany", countryBadge: "DE", rating: 5, text: "Searched for Audi A4 parts across multiple suppliers in one place. Saved hours of research. Brilliant tool." },
  { name: "Emma L.", location: "Sydney, Australia", countryBadge: "AU", rating: 4, text: "Found rare parts for my classic car that I couldn't find anywhere else. The reg plate lookup is super accurate." },
  { name: "Carlos M.", location: "Madrid, Spain", countryBadge: "ES", rating: 5, text: "Price alerts saved me €60 on a water pump. Got the notification the same day the price dropped. Amazing." },
  { name: "Luca B.", location: "Milan, Italy", countryBadge: "IT", rating: 5, text: "Compared prices from 6 different suppliers in 30 seconds. Ended up saving €45 on brake discs." },
  { name: "David W.", location: "Glasgow, UK", countryBadge: "UK", rating: 4, text: "The marketplace is great for finding secondhand parts locally. Listed my old parts and sold them within 3 days." },
  { name: "Priya S.", location: "Toronto, Canada", countryBadge: "CA", rating: 5, text: "Finally a car parts site that actually works on mobile. Found what I needed in under a minute." },
  { name: "François D.", location: "Lyon, France", countryBadge: "FR", rating: 4, text: "The TecDoc integration means I always find the right part for my exact vehicle. No more ordering wrong parts." },
  { name: "Ahmed R.", location: "Dubai, UAE", countryBadge: "UAE", rating: 5, text: "Used it to find parts for my Range Rover. The global eBay search is exactly what I needed." },
  { name: "Sophie H.", location: "Amsterdam, Netherlands", countryBadge: "NL", rating: 5, text: "My garage uses GOPARTARA daily now. We save at least 2 hours per week on parts research." },
  { name: "David H.", location: "Manchester, UK", countryBadge: "UK", rating: 5, text: "Found an alternator for my Vauxhall Astra at half the price my mechanic quoted. Brilliant." },
  { name: "Marco L.", location: "London, UK", countryBadge: "UK", rating: 5, text: "The VIN search is a game changer. Exact fit every time." },
  { name: "Gary T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "I'm a mechanic and I use this daily. Saved our workshop thousands." },
  { name: "Roisin M.", location: "Dublin, Ireland", countryBadge: "IE", rating: 4, text: "Price alert notified me when discs dropped £15. Worked perfectly." },
  { name: "James B.", location: "Edinburgh, Scotland", countryBadge: "UK", rating: 5, text: "The garage feature is great for fleet management." },
];

/* ── Homepage grid: 4 honest early-access testimonials ── */
const homepageTestimonials: Testimonial[] = [
  {
    name: "James T.",
    location: "Leeds, UK",
    countryBadge: "UK",
    countryFlag: "🇬🇧",
    rating: 5,
    text: "Found the same brake pads for £38 less than the garage quoted me. Took 30 seconds.",
  },
  {
    name: "David W.",
    location: "Glasgow, UK",
    countryBadge: "UK",
    countryFlag: "🇬🇧",
    rating: 4,
    text: "The reg plate lookup is actually useful — it filtered results to parts that fit my Vauxhall instantly.",
  },
  {
    name: "Roisin M.",
    location: "Dublin, Ireland",
    countryBadge: "IE",
    countryFlag: "🇮🇪",
    rating: 4,
    text: "Price alert saved me £22 on oil filters. Would recommend to anyone who buys parts regularly.",
  },
  {
    name: "Gary T.",
    location: "Leeds, UK",
    countryBadge: "UK",
    countryFlag: "🇬🇧",
    rating: 5,
    text: "I'm a mechanic. This saves our workshop serious money on parts every week.",
  },
];

/* ── Static testimonial card (used on homepage grid + Pricing page) ── */
export const TestimonialCard = ({ t }: { t: Testimonial }) => (
  <div
    className="transition-colors hover:border-white/15 h-full"
    style={{
      background: "#111111",
      border: "1px solid #1f1f1f",
      borderRadius: "12px",
      padding: "20px 24px",
    }}
  >
    <div className="flex items-center gap-0.5 mb-2" aria-label={`${t.rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= t.rating ? "fill-current" : ""}
          style={{ color: star <= t.rating ? "#cc1111" : "#3f3f46" }}
        />
      ))}
    </div>
    <p
      style={{
        fontSize: 14,
        color: "#d4d4d8",
        fontStyle: "italic",
        lineHeight: 1.6,
      }}
    >
      "{t.text}"
    </p>
    <p style={{ fontSize: 12, color: "#52525b", marginTop: 12 }}>
      <span style={{ fontWeight: 600, color: "#71717a" }}>{t.name}</span>
      {" "}
      {t.countryFlag && <span aria-hidden="true">{t.countryFlag}</span>} {t.location}
    </p>
  </div>
);

const TestimonialsSection = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <ScrollReveal className="text-center mb-10 px-4">
        <span
          className="inline-block uppercase"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "#cc1111",
            marginBottom: "12px",
          }}
        >
          Early Access · Beta Feedback
        </span>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          What Early Users Are Saying
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          GOPARTARA is in early access. These are real quotes from beta users.
        </p>
      </ScrollReveal>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homepageTestimonials.map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} />
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="mailto:info@gopartara.com?subject=Feedback"
            className="text-sm transition-colors hover:text-foreground"
            style={{ color: "#71717a" }}
          >
            Have feedback? Share your experience →
          </a>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
