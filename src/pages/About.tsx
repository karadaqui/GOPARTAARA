import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import SocialProofStats from "@/components/SocialProofStats";
import HomeCTASection from "@/components/HomeCTASection";
import Breadcrumbs from "@/components/Breadcrumbs";
import { User } from "lucide-react";

const TEAM = [
  { name: "Name coming soon", role: "Founder & CEO", bio: "Leading the GOPARTARA mission to make car parts simple, transparent and fair for every UK driver." },
  { name: "Name coming soon", role: "Head of Technology", bio: "Building the search infrastructure that pulls live pricing from 7 suppliers in under 3 seconds." },
  { name: "Name coming soon", role: "Head of Partnerships", bio: "Bringing trusted UK suppliers onto the platform so drivers always get the best available price." },
];

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  color: "#cc1111",
  textTransform: "uppercase",
  marginBottom: "12px",
  display: "inline-block",
};

const VALUES = [
  {
    title: "Transparency",
    desc: "We show you all prices, even when we don't earn commission. No bias, no hidden ranking.",
  },
  {
    title: "Speed",
    desc: "Results in under 3 seconds, pulled live from 7 supplier APIs every single search.",
  },
  {
    title: "Savings",
    desc: "Compare prices from 7 live suppliers in one search — no more overpaying without knowing it.",
  },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="About GOPARTARA — UK Car Parts Price Comparison"
      description="GOPARTARA was built to end car parts confusion. We search 7 suppliers simultaneously so you always get the best price. Transparent, unbiased, always free to browse."
      path="/about"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "GOPARTARA Ltd",
        "url": "https://gopartara.com",
        "logo": "https://gopartara.com/logo.png",
        "description": "GOPARTARA is a UK car parts price comparison platform that searches 7 suppliers simultaneously.",
        "foundingDate": "2026",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "info@gopartara.com",
          "contactType": "customer service",
          "availableLanguage": "English",
        },
        "sameAs": [
          "https://twitter.com/gopartara",
          "https://www.youtube.com/@gopartara",
        ],
      }}
      additionalJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About GOPARTARA",
          "url": "https://gopartara.com/about",
          "description": "Learn how GOPARTARA is revolutionising car part search in the UK.",
        },
      ]}
    />
    <Navbar />

    <main className="pt-24 pb-16">
      {/* Editorial header */}
      <section className="container px-4 max-w-5xl mx-auto" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        <Breadcrumbs
          className="mb-6"
          items={[{ label: "Home", href: "/" }, { label: "About" }]}
        />
        <span style={SECTION_LABEL}>About</span>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(40px, 5vw, 64px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "white",
          }}
        >
          We're on a mission to
          <br />
          <span style={{ color: "#cc1111" }}>end car parts confusion.</span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#71717a",
            lineHeight: 1.6,
            maxWidth: "600px",
            marginTop: "24px",
          }}
        >
          GOPARTARA was built because finding the right car part at the right price
          shouldn't take hours of searching. We built the search engine the
          industry was missing.
        </p>
      </section>

      {/* Story — The Problem / Our Solution */}
      <section className="container px-4 max-w-5xl mx-auto pb-24">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <span style={SECTION_LABEL}>The Problem</span>
            <h2
              className="font-display text-white"
              style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}
            >
              A market built for confusion.
            </h2>
            <p style={{ fontSize: "15px", color: "#a1a1aa", lineHeight: 1.7 }}>
              The UK car parts market is fragmented across hundreds of sellers, factor branches,
              and online retailers — each with their own catalogue, pricing structure, and
              inventory system. Drivers waste hours opening tabs, copying part numbers, and
              second-guessing whether they're being overcharged.
            </p>
          </div>
          <div>
            <span style={SECTION_LABEL}>Our Solution</span>
            <h2
              className="font-display text-white"
              style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}
            >
              One search. Every supplier.
            </h2>
            <p style={{ fontSize: "15px", color: "#a1a1aa", lineHeight: 1.7 }}>
              GOPARTARA aggregates live inventory and pricing from 7 trusted UK suppliers into a
              single, unbiased search. Type a part name, snap a photo, or enter your reg plate —
              and within seconds you see every option, sorted by price, with no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Values — 3 cards with red top borders */}
      <section className="container px-4 max-w-5xl mx-auto pb-24">
        <span style={SECTION_LABEL}>Our Values</span>
        <h2
          className="font-display text-white mb-10"
          style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          What we stand for.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              style={{
                borderTop: "2px solid #cc1111",
                paddingTop: "20px",
              }}
            >
              <h3
                className="font-display text-white"
                style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.01em" }}
              >
                {v.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company Timeline */}
      <section className="container px-4 max-w-3xl mx-auto pb-24">
        <span style={SECTION_LABEL}>Our Journey</span>
        <h2
          className="font-display text-white mb-10"
          style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.01em" }}
        >
          Company Timeline
        </h2>

        <ol style={{ position: "relative", paddingLeft: 28, listStyle: "none" }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 11,
              top: 6,
              bottom: 6,
              width: 2,
              background: "linear-gradient(to bottom, #cc1111, #27272a)",
              opacity: 0.6,
            }}
          />
          {[
            { icon: "🚀", year: "2024", text: "GOPARTARA Founded. The idea: one search engine for all UK car parts." },
            { icon: "🔧", year: "Early 2025", text: "First 7 suppliers integrated. 1,000,000+ parts searchable for the first time." },
            { icon: "📈", year: "Mid 2025", text: "Beta launched. First real users start saving money on car parts." },
            { icon: "🌍", year: "2026", text: "European expansion begins. EU suppliers added. Going global." },
            { icon: "🎯", year: "Future", text: "500+ suppliers. Mobile app. The world's #1 car parts comparison platform.", future: true },
          ].map((m, idx, arr) => (
            <li
              key={m.year}
              style={{
                position: "relative",
                paddingBottom: idx === arr.length - 1 ? 0 : 28,
                opacity: m.future ? 0.55 : 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: -22,
                  top: 4,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: m.future ? "#1a1a1a" : "#0a0a0a",
                  border: `2px solid ${m.future ? "#3f3f46" : "#cc1111"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                }}
              >
                {m.icon}
              </span>
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginLeft: 6,
                }}
              >
                <div
                  style={{
                    color: m.future ? "#a1a1aa" : "#cc1111",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {m.icon} {m.year}
                </div>
                <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                  {m.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">PRESS & MEDIA</p>
            <h2 className="text-3xl font-bold text-white mb-3">Press & Media</h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Journalists and content creators — everything you need to cover GOPARTARA.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { emoji: "📰", title: "Press Releases", desc: "Latest announcements and company news.", label: "Coming soon", href: null },
              { emoji: "🎨", title: "Brand Assets", desc: "Logos, colors, and brand guidelines.", label: "Download Kit →", href: "mailto:press@gopartara.com?subject=Media%20Kit%20Request" },
              { emoji: "📸", title: "Screenshots & Media", desc: "Product screenshots and promotional images.", label: "Request Access →", href: "mailto:press@gopartara.com?subject=Media%20Access%20Request" },
            ].map((card) => (
              <div key={card.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-white/20 transition-colors">
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-400 mb-5 flex-1">{card.desc}</p>
                {card.href ? (
                  <a
                    href={card.href}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {card.label}
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center px-4 py-2 bg-white/5 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                    {card.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">OUR TEAM</p>
          <h2 className="text-3xl font-bold text-white mb-4">Meet the Team</h2>
          <p className="text-gray-400">The people building GOPARTARA.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: null, role: "Founder & CEO", bio: "Visionary behind GOPARTARA, passionate about making car parts accessible to everyone." },
            { name: null, role: "Head of Technology", bio: "Building the search engine and infrastructure that powers 1M+ part comparisons." },
            { name: null, role: "Head of Partnerships", bio: "Growing our supplier network and forging relationships with the automotive industry." },
            { name: "Fatma Karadayı", role: "Language & Localisation", bio: "Leading our multilingual expansion — ensuring GOPARTARA speaks every driver's language across the UK and Europe." }
          ].map((member, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              </div>
              {member.name && (
                <p className="text-white font-bold text-base mb-1">{member.name}</p>
              )}
              <h3 className={`font-bold ${member.name ? "text-[#cc1111] text-xs uppercase tracking-wider mb-2" : "text-white text-lg mb-1"}`}>{member.role}</h3>
              <p className="text-gray-400 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-sm mt-8">Team photos and full bios coming soon.</p>
      </section>

      {/* Stats bar (reused) */}
      <SocialProofStats />

      {/* CTA — same as homepage */}
      <HomeCTASection />
    </main>

    <Footer />
    <BackToTop />
  </div>
);

export default About;
