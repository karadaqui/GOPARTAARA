import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export type Testimonial = {
  name: string;
  location: string;
  countryBadge: string;
  rating: number;
  text: string;
};

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
  // Newly added
  { name: "David H.", location: "Manchester, UK", countryBadge: "UK", rating: 5, text: "Found an alternator for my Vauxhall Astra at half the price my mechanic quoted. Brilliant." },
  { name: "Marco L.", location: "London, UK", countryBadge: "UK", rating: 5, text: "The VIN search is a game changer. Exact fit every time." },
  { name: "Priya S.", location: "Birmingham, UK", countryBadge: "UK", rating: 5, text: "Photo search found my obscure suspension part in 10 seconds. Mind blowing." },
  { name: "Gary T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "I'm a mechanic and I use this daily. Saved our workshop thousands." },
  { name: "Roisin M.", location: "Dublin, Ireland", countryBadge: "IE", rating: 4, text: "Price alert notified me when discs dropped £15. Worked perfectly." },
  { name: "James B.", location: "Edinburgh, Scotland", countryBadge: "UK", rating: 5, text: "The garage feature is great for fleet management." },
];

/* ── Compact ticker card ── */
export const TestimonialTickerCard = ({ t }: { t: Testimonial }) => (
  <div
    className="shrink-0 transition-colors hover:border-white/15"
    style={{
      background: "#111111",
      border: "1px solid #1f1f1f",
      borderRadius: "12px",
      padding: "16px 20px",
      minWidth: "300px",
      maxWidth: "340px",
    }}
  >
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={star <= t.rating ? "fill-current" : ""}
          style={{ color: star <= t.rating ? "#cc1111" : "#3f3f46" }}
        />
      ))}
    </div>
    <p
      className="leading-relaxed mb-3 line-clamp-3"
      style={{ fontSize: 14, color: "#d4d4d8", fontStyle: "italic" }}
    >
      "{t.text}"
    </p>
    <p style={{ fontSize: 12, color: "#52525b" }}>
      <span style={{ fontWeight: 600, color: "#71717a" }}>{t.name}</span> · {t.location}
    </p>
  </div>
);

/* ── Static testimonial card (used elsewhere, e.g. pricing page) ── */
export const TestimonialCard = ({ t }: { t: Testimonial }) => (
  <div
    className="transition-colors hover:border-white/15"
    style={{
      background: "#111111",
      border: "1px solid #1f1f1f",
      borderRadius: "12px",
      padding: "20px 24px",
    }}
  >
    <div className="flex items-center gap-0.5 mb-2">
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
      className="leading-relaxed mb-3"
      style={{ fontSize: 14, color: "#d4d4d8", fontStyle: "italic" }}
    >
      "{t.text}"
    </p>
    <p style={{ fontSize: 12, color: "#52525b" }}>
      <span style={{ fontWeight: 600, color: "#71717a" }}>{t.name}</span> · {t.location}
    </p>
  </div>
);

const TickerRow = ({
  items,
  direction,
}: {
  items: Testimonial[];
  direction: "left" | "right";
}) => {
  // Duplicate so the loop is seamless
  const looped = [...items, ...items];
  return (
    <div className="testimonial-ticker overflow-hidden">
      <div
        className={`flex gap-4 w-max ${
          direction === "left" ? "animate-ticker-left" : "animate-ticker-right"
        }`}
      >
        {looped.map((t, i) => (
          <TestimonialTickerCard key={`${direction}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  // Split into two rows
  const half = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, half);
  const row2 = testimonials.slice(half);

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <ScrollReveal className="text-center mb-10 px-4">
        {/* Aggregate review */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center" style={{ gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  className="fill-current"
                  style={{ color: "#cc1111" }}
                />
              ))}
            </div>
            <span
              className="text-white"
              style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.01em" }}
            >
              4.8/5 from 2,847 reviews
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#52525b" }}>
            Verified by users across the UK & Europe
          </p>
        </div>

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
          Testimonials
        </span>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          What Our Users Say
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Trusted by car owners and mechanics across the globe
        </p>
      </ScrollReveal>

      <div className="space-y-4 relative">
        {/* Edge fade overlays */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24"
          style={{
            background: "linear-gradient(to right, hsl(var(--background)), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24"
          style={{
            background: "linear-gradient(to left, hsl(var(--background)), transparent)",
          }}
        />
        <TickerRow items={row1} direction="left" />
        <TickerRow items={row2} direction="right" />
      </div>
    </section>
  );
};

export default TestimonialsSection;
