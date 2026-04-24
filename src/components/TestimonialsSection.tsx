import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const testimonials = [
  { name: "James T.", location: "Leeds, UK", countryBadge: "UK", rating: 5, text: "GOPARTARA saved me £40 on my BMW's brake pads. Found the same part cheaper than my local garage quoted. Unbelievable.", avatar: "J" },
  { name: "Sarah M.", location: "Manchester, UK", countryBadge: "UK", rating: 5, text: "The photo search is incredible. I had no idea what a part was called, took a photo and found it in seconds.", avatar: "S" },
  { name: "Mike R.", location: "Birmingham, UK", countryBadge: "UK", rating: 4, text: "As a DIY mechanic I use GOPARTARA every week. It's become my go-to before buying any part.", avatar: "M" },
  { name: "Thomas K.", location: "Berlin, Germany", countryBadge: "DE", rating: 5, text: "Searched for Audi A4 parts across multiple suppliers in one place. Saved hours of research. Brilliant tool.", avatar: "T" },
  { name: "Emma L.", location: "Sydney, Australia", countryBadge: "AU", rating: 4, text: "Found rare parts for my classic car that I couldn't find anywhere else. The reg plate lookup is super accurate.", avatar: "E" },
  { name: "Carlos M.", location: "Madrid, Spain", countryBadge: "ES", rating: 5, text: "Price alerts saved me €60 on a water pump. Got the notification the same day the price dropped. Amazing.", avatar: "C" },
  { name: "Luca B.", location: "Milan, Italy", countryBadge: "IT", rating: 5, text: "Compared prices from 6 different suppliers in 30 seconds. Ended up saving €45 on brake discs.", avatar: "L" },
  { name: "David W.", location: "Glasgow, UK", countryBadge: "UK", rating: 4, text: "The marketplace is great for finding secondhand parts locally. Listed my old parts and sold them within 3 days.", avatar: "D" },
  { name: "Priya S.", location: "Toronto, Canada", countryBadge: "CA", rating: 5, text: "Finally a car parts site that actually works on mobile. Found what I needed in under a minute.", avatar: "P" },
  { name: "François D.", location: "Lyon, France", countryBadge: "FR", rating: 4, text: "The TecDoc integration means I always find the right part for my exact vehicle. No more ordering wrong parts.", avatar: "F" },
  { name: "Ahmed R.", location: "Dubai, UAE", countryBadge: "UAE", rating: 5, text: "Used it to find parts for my Range Rover. The global eBay search is exactly what I needed.", avatar: "A" },
  { name: "Sophie H.", location: "Amsterdam, Netherlands", countryBadge: "NL", rating: 5, text: "My garage uses GOPARTARA daily now. We save at least 2 hours per week on parts research.", avatar: "S" },
];

const TestimonialCard = ({ t }: { t: typeof testimonials[0] }) => (
  <div className="w-full max-w-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 transition-colors hover:border-primary/20 hover:bg-card/60">
    <div className="flex items-center gap-0.5 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={star <= t.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}
        />
      ))}
    </div>
    <p className="text-sm text-foreground leading-relaxed mb-4 line-clamp-3">"{t.text}"</p>
    <div className="flex items-center gap-3 pt-3 border-t border-border/30">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
        {t.avatar}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t.name}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-bold">{t.countryBadge}</span> {t.location}</p>
      </div>
    </div>
  </div>
);

const uniqueTestimonials = testimonials.slice(0, 6);

const TestimonialsSection = () => (
  <section className="py-12 md:py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

    <ScrollReveal className="text-center mb-16 px-4">
      <span className="inline-block uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", color: "#cc1111", marginBottom: "12px" }}>
        Testimonials
      </span>
      <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
        What Our Users Say
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
        Trusted by car owners and mechanics across the globe
      </p>
    </ScrollReveal>

    <div className="container px-4 mx-auto max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueTestimonials.map((t, i) => (
          <div key={`t-${i}`} className="w-full">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
