import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const testimonials = [
  { name: "James T.", location: "Leeds, United Kingdom", rating: 5, text: "GOPARTARA saved me £40 on my BMW's brake pads. Found the same part cheaper than my local garage quoted. Unbelievable.", avatar: "JT" },
  { name: "Sarah M.", location: "Manchester, United Kingdom", rating: 5, text: "The photo search is incredible. I had no idea what a part was called, took a photo and found it in seconds.", avatar: "SM" },
  { name: "Mike R.", location: "Birmingham, United Kingdom", rating: 4, text: "As a DIY mechanic I use GOPARTARA every week. It's become my go-to before buying any part.", avatar: "MR" },
  { name: "Thomas K.", location: "Berlin, Germany", rating: 5, text: "Searched for Audi A4 parts across multiple suppliers in one place. Saved hours of research. Brilliant tool.", avatar: "TK" },
  { name: "Emma L.", location: "Sydney, Australia", rating: 4, text: "Found rare parts for my classic car that I couldn't find anywhere else. The reg plate lookup is super accurate.", avatar: "EL" },
  { name: "Carlos M.", location: "Madrid, Spain", rating: 5, text: "Price alerts saved me €60 on a water pump. Got the notification the same day the price dropped. Amazing.", avatar: "CM" },
  { name: "Luca B.", location: "Milan, Italy", rating: 5, text: "Compared prices from 6 different suppliers in 30 seconds. Ended up saving €45 on brake discs.", avatar: "LB" },
  { name: "David W.", location: "Glasgow, United Kingdom", rating: 4, text: "The marketplace is great for finding secondhand parts locally. Listed my old parts and sold them within 3 days.", avatar: "DW" },
  { name: "Priya S.", location: "Toronto, Canada", rating: 5, text: "Finally a car parts site that actually works on mobile. Found what I needed in under a minute.", avatar: "PS" },
];

const TestimonialCard = ({ t }: { t: typeof testimonials[0] }) => (
  <div
    className="break-inside-avoid mb-4 testimonial-card"
    style={{
      background: "#111111",
      border: "1px solid #1f1f1f",
      borderRadius: "16px",
      padding: "24px",
      transition: "border-color 200ms ease, transform 200ms ease",
    }}
  >
    {/* Stars — brand red */}
    <div className="flex items-center gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          style={{
            color: "#cc1111",
            fill: star <= t.rating ? "#cc1111" : "transparent",
          }}
        />
      ))}
    </div>

    {/* Quote */}
    <p
      style={{
        color: "#d4d4d8",
        fontSize: "14px",
        lineHeight: 1.7,
        fontStyle: "italic",
        marginBottom: "20px",
      }}
    >
      "{t.text}"
    </p>

    {/* Author */}
    <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #1f1f1f" }}>
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "999px",
          background: "#27272a",
          color: "#a1a1aa",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {t.avatar}
      </div>
      <div className="min-w-0">
        <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>
          {t.name}
        </p>
        <p style={{ color: "#52525b", fontSize: "12px", lineHeight: 1.4, marginTop: "2px" }}>
          {t.location}
        </p>
      </div>
    </div>
  </div>
);

const uniqueTestimonials = testimonials.slice(0, 9);

const TestimonialsSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden">
    <ScrollReveal className="text-center mb-16 md:mb-20 px-4">
      <span className="ds-eyebrow">Testimonials</span>
      <h2 className="ds-h2 mt-2 mb-5">What Our Users Say</h2>
      <p className="ds-body max-w-xl mx-auto">
        Trusted by car owners and mechanics across the globe.
      </p>
    </ScrollReveal>

    <div className="container px-4 mx-auto max-w-6xl">
      {/* Masonry via CSS columns */}
      <div
        style={{
          columnGap: "16px",
        }}
        className="columns-1 sm:columns-2 lg:columns-3"
      >
        {uniqueTestimonials.map((t, i) => (
          <TestimonialCard key={`t-${i}`} t={t} />
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
