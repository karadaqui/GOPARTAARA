import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Mail, Sparkles, CreditCard, Bell, Car, ShoppingBag, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Category {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
}

interface Article {
  title: string;
  category: string;
  href: string;
}

const categories: Category[] = [
  { id: "getting-started", icon: <Sparkles size={28} className="text-[#cc1111]" />, title: "Getting Started", description: "Search, reg plate lookup, photo search", count: 8 },
  { id: "pricing", icon: <CreditCard size={28} className="text-[#cc1111]" />, title: "Pricing & Plans", description: "Free, Pro and Elite plan details", count: 6 },
  { id: "alerts", icon: <Bell size={28} className="text-[#cc1111]" />, title: "Price Alerts", description: "Setting up and managing price alerts", count: 5 },
  { id: "garage", icon: <Car size={28} className="text-[#cc1111]" />, title: "My Garage", description: "Adding vehicles, MOT reminders", count: 7 },
  { id: "marketplace", icon: <ShoppingBag size={28} className="text-[#cc1111]" />, title: "Marketplace", description: "Buying and selling parts", count: 9 },
  { id: "account", icon: <Shield size={28} className="text-[#cc1111]" />, title: "Account & Privacy", description: "Account settings, data, GDPR", count: 6 },
];

const popularArticles: Article[] = [
  { title: "How to search for car parts using your reg plate", category: "Getting Started", href: "/blog" },
  { title: "Setting up your first price alert", category: "Price Alerts", href: "/blog" },
  { title: "Comparing Free, Pro and Elite plans", category: "Pricing & Plans", href: "/pricing" },
  { title: "Adding a vehicle to your garage", category: "My Garage", href: "/garage" },
  { title: "How to list a part for sale on the marketplace", category: "Marketplace", href: "/list-your-parts" },
  { title: "Understanding price quality badges", category: "Getting Started", href: "/blog" },
  { title: "Managing MOT and tax reminders", category: "My Garage", href: "/garage" },
  { title: "How to delete your account and data", category: "Account & Privacy", href: "/privacy" },
];

const faqs = [
  { q: "Is GOPARTARA free to use?", a: "Yes — searching for car parts is completely free. You can compare prices from over a million parts across multiple suppliers without signing up. Free accounts also unlock saved parts, 1 garage vehicle and basic price alerts. Pro and Elite plans add advanced features like unlimited alerts and priority support." },
  { q: "Which suppliers do you search?", a: "We aggregate live prices from eBay Global, mytyres.co.uk, Tyres UK, Autodoc, Amazon UK and a growing list of trusted parts retailers. Our marketplace also lets independent sellers list parts directly, giving you both retail and peer-to-peer options in one place." },
  { q: "How do price alerts work?", a: "Set a target price for any part you're tracking and we'll email you the moment a matching listing drops to that price or below. Free users can set up to 3 active alerts; Pro users get unlimited alerts plus instant notifications." },
  { q: "Can I sell parts on GOPARTARA?", a: "Yes — all registered members can list up to 5 parts free on our marketplace. Listings are reviewed for quality before going live. Need to list more? Boost packages and seller plans unlock unlimited listings, featured placement and verified seller badges." },
  { q: "Do I need an account to use GOPARTARA?", a: "No account is needed for the first 3 searches. Sign up for free to unlock unlimited searches, saved parts, your garage and price alerts. Sign-up takes under 30 seconds with email or Google." },
  { q: "How do I cancel my subscription?", a: "You can cancel any time from your dashboard under Subscription → Manage. Your plan stays active until the end of the current billing period — no questions asked, no cancellation fees." },
];

const Help = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return popularArticles;
    return popularArticles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SEOHead
        title="Help Center | GOPARTARA"
        description="Find answers to common questions about searching, price alerts, the marketplace, your garage and your account on GOPARTARA."
        path="/help"
      />
      <Navbar />

      {/* Header */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(800px 400px at 50% 0%, rgba(204,17,17,0.08), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <Breadcrumbs
            className="mb-6 justify-center [&>ol]:justify-center"
            items={[{ label: "Home", href: "/" }, { label: "Help" }]}
          />
          <h1
            className="font-display font-extrabold text-white"
            style={{
              fontSize: "clamp(36px, 5vw, 48px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            How can we help?
          </h1>
          <p className="mt-4 text-[15px] text-zinc-400">
            Search our guides or browse by topic
          </p>

          <div className="mt-8 mx-auto max-w-[600px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for help..."
                className="w-full bg-[#111111] border border-[#27272a] rounded-xl pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#cc1111]/50 focus:ring-2 focus:ring-[#cc1111]/15 transition-colors"
                style={{ height: 52, fontSize: 15 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="group block rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] hover:bg-[#111111] hover:border-[#2a2a2a] transition-colors p-6"
              >
                <div className="mb-4">{c.icon}</div>
                <h3 className="text-[16px] font-semibold text-white group-hover:text-[#cc1111] transition-colors">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">{c.description}</p>
                <p className="mt-4 text-[13px] text-[#52525b]">{c.count} articles</p>
              </a>
            ))}
            {filteredCategories.length === 0 && (
              <div className="col-span-full text-center text-sm text-zinc-500 py-10">
                No categories match "{query}"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Popular articles</h2>
          <div className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] overflow-hidden">
            {filteredArticles.map((a, i) => (
              <Link
                key={i}
                to={a.href}
                className="group flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1f1f1f] last:border-b-0 hover:bg-[#111111] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-zinc-600 group-hover:text-[#cc1111] transition-colors"
                  />
                  <span className="text-[14px] text-zinc-300 group-hover:text-white transition-colors truncate">
                    {a.title}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#cc1111]/10 text-[#cc1111] border border-[#cc1111]/20">
                  {a.category}
                </span>
              </Link>
            ))}
            {filteredArticles.length === 0 && (
              <div className="text-center text-sm text-zinc-500 py-10">
                No articles match "{query}"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-[#1f1f1f] rounded-xl px-5 bg-[#0f0f0f]"
              >
                <AccordionTrigger className="text-[14px] font-medium text-white hover:no-underline py-4 text-left">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] text-zinc-400 pb-4 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[#cc1111]/20 bg-gradient-to-br from-[#cc1111]/[0.08] to-transparent p-8 sm:p-10 text-center">
            <Mail size={28} className="text-[#cc1111] mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Can't find what you're looking for?
            </h3>
            <p className="mt-2 text-[14px] text-zinc-400">
              Email us at{" "}
              <a href="mailto:info@gopartara.com" className="text-[#cc1111] hover:underline">
                info@gopartara.com
              </a>{" "}
              — we reply within 24 hours.
            </p>
            <button
              onClick={() => navigate("/contact")}
              className="mt-6 inline-flex items-center gap-2 bg-[#cc1111] hover:bg-[#b30e0e] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Send us a message <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;
