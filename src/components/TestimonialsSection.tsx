import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const testimonials = [
  {
    quote: "PARTARA saved me £40 on my BMW's brake pads. Found the same part £40 cheaper than my local garage quoted.",
    name: "James T.",
    location: "Leeds",
  },
  {
    quote: "The photo search feature is incredible. I had no idea what a part was called, took a photo, and found it in seconds.",
    name: "Sarah M.",
    location: "Manchester",
  },
  {
    quote: "As a DIY mechanic I use PARTARA every week. It's become my go-to before buying any part.",
    name: "Mike R.",
    location: "Birmingham",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
    <div className="container px-4 relative">
      <ScrollReveal className="text-center mb-16">
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          Testimonials
        </span>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          What Our Users Say
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Real feedback from real car owners across the UK.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <ScrollReveal key={t.name} delay={i + 1}>
            <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:border-primary/20 hover:bg-card/60">
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} size={14} className="fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
