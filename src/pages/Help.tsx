import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Mail, Sparkles, CreditCard, Bell, Car, ShoppingBag, Shield, MessageCircle } from "lucide-react";
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
  { id: "getting-started", icon: <Sparkles size={28} className="text-[#cc1111]" />, title: "Getting Started", description: "Search, reg plate lookup, photo search", count: 4 },
  { id: "pricing-plans", icon: <CreditCard size={28} className="text-[#cc1111]" />, title: "Pricing & Plans", description: "Free, Pro and Elite plan details", count: 4 },
  { id: "price-alerts", icon: <Bell size={28} className="text-[#cc1111]" />, title: "Price Alerts", description: "Setting up and managing price alerts", count: 3 },
  { id: "my-garage", icon: <Car size={28} className="text-[#cc1111]" />, title: "My Garage", description: "Adding vehicles, MOT reminders", count: 3 },
  { id: "marketplace", icon: <ShoppingBag size={28} className="text-[#cc1111]" />, title: "Marketplace", description: "Buying and selling parts", count: 4 },
  { id: "account-privacy", icon: <Shield size={28} className="text-[#cc1111]" />, title: "Account & Privacy", description: "Account settings, data, GDPR", count: 3 },
];

const popularArticles: Article[] = [
  { title: "How to search using your reg plate", category: "Getting Started", href: "/help/getting-started" },
  { title: "Setting up your first price alert", category: "Price Alerts", href: "/help/price-alerts" },
  { title: "Comparing Free, Pro and Elite plans", category: "Pricing & Plans", href: "/help/pricing-plans" },
  { title: "Adding a vehicle to your garage", category: "My Garage", href: "/help/my-garage" },
  { title: "How to list a part for sale", category: "Marketplace", href: "/help/marketplace" },
  { title: "Understanding price quality badges", category: "Getting Started", href: "/help/getting-started" },
  { title: "Managing MOT and tax reminders", category: "My Garage", href: "/help/my-garage" },
  { title: "How to delete your account and data", category: "Account & Privacy", href: "/help/account-privacy" },
];

const faqLinkStyle: React.CSSProperties = {
  color: "#cc1111",
  textDecoration: "underline",
  fontWeight: 500,
  cursor: "pointer",
};

const FaqLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    style={faqLinkStyle}
    onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#e01111")}
    onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#cc1111")}
  >
    {children}
  </a>
);

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is GOPARTARA free to use?",
    a: (
      <>
        Yes. You can search up to 10 times per month, save 5 parts, and set 5 price alerts completely free. No credit card needed.{" "}
        <FaqLink href="/pricing">Pro (£9.99/mo)</FaqLink> and{" "}
        <FaqLink href="/pricing">Elite (£19.99/mo)</FaqLink> plans offer more features.
      </>
    ),
  },
  {
    q: "Which suppliers do you search?",
    a: "We currently search eBay Global, mytyres.co.uk, Tyres UK, Green Spark Plug Co., neumaticos-online.es, Pneumatici IT, and ReifenDirekt EE — 7 suppliers simultaneously.",
  },
  {
    q: "How do price alerts work?",
    a: "Click the bell icon on any search result. Set your target price. We check that listing's price every 6 hours and email you at your registered address when it drops below your target.",
  },
  {
    q: "Can I sell parts on GOPARTARA?",
    a: (
      <>
        Yes. All registered users can list up to 5 parts for free on our{" "}
        <FaqLink href="/marketplace">marketplace</FaqLink>.{" "}
        <FaqLink href="/pricing">Pro and Elite subscribers</FaqLink> get unlimited listings and up to 10 photos per listing.
      </>
    ),
  },
  {
    q: "Do I need an account to use GOPARTARA?",
    a: (
      <>
        No account needed for basic searching. However, you'll need a{" "}
        <FaqLink href="/auth">free account</FaqLink> to save parts, set price alerts, use{" "}
        <FaqLink href="/garage">My Garage</FaqLink>, or list on the{" "}
        <FaqLink href="/marketplace">marketplace</FaqLink>.
      </>
    ),
  },
  {
    q: "How do I cancel my subscription?",
    a: (
      <>
        Go to <FaqLink href="/dashboard">Dashboard</FaqLink> → Subscription → Cancel Plan. You can cancel anytime. Your plan stays active until the billing period ends.
      </>
    ),
  },
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
        description="Find answers to common questions about searching for parts, pricing plans, price alerts, My Garage, the marketplace and your account."
        path="/help"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is GOPARTARA free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. You can search up to 10 times per month, save 5 parts, and set 5 price alerts completely free. No credit card needed. Pro (£9.99/mo) and Elite (£19.99/mo) plans offer more features.",
              },
            },
            {
              "@type": "Question",
              "name": "Which suppliers do you search?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We currently search eBay Global, mytyres.co.uk, Tyres UK, Green Spark Plug Co., neumaticos-online.es, Pneumatici IT, and ReifenDirekt EE — 7 suppliers simultaneously.",
              },
            },
            {
              "@type": "Question",
              "name": "How do price alerts work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Click the bell icon on any search result, set your target price, and we will email you when that listing drops below your target. We check prices every 6 hours.",
              },
            },
            {
              "@type": "Question",
              "name": "Can I sell parts on GOPARTARA?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. All registered users can list up to 5 parts for free on our marketplace. Pro and Elite subscribers get unlimited listings.",
              },
            },
            {
              "@type": "Question",
              "name": "Do I need an account to use GOPARTARA?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No account is needed for basic searching. You will need a free account to save parts, set price alerts, use My Garage, or list on the marketplace.",
              },
            },
            {
              "@type": "Question",
              "name": "How do I cancel my subscription?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Go to Dashboard, then Subscription, then Cancel Plan. You can cancel anytime. Your plan stays active until the billing period ends.",
              },
            },
          ],
        }}
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
              <Link
                key={c.id}
                to={`/help/${c.id}`}
                className="group block rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] hover:bg-[#111111] hover:border-[#2a2a2a] transition-colors p-6"
              >
                <div className="mb-4">{c.icon}</div>
                <h3 className="text-[16px] font-semibold text-white group-hover:text-[#cc1111] transition-colors">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">{c.description}</p>
                <p className="mt-4 text-[13px] text-[#52525b]">{c.count} articles</p>
              </Link>
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
