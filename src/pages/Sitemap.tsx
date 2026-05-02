import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

type Section = {
  title: string;
  links: { label: string; href: string }[];
};

const SECTIONS: Section[] = [
  {
    title: "Main",
    links: [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Deals", href: "/deals" },
      { label: "Pricing", href: "/pricing" },
      { label: "Tyres", href: "/tyres" },
      { label: "EV Charging", href: "/ev-charging" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Garage", href: "/garage" },
      { label: "Price Alerts", href: "/alerts" },
      { label: "Sign In", href: "/auth" },
      { label: "Sign Up", href: "/auth" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "For Business", href: "/business" },
      { label: "Help Center", href: "/help" },
      { label: "System Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Site Map — GOPARTARA"
        description="Browse all sections and pages on GOPARTARA: search car parts, marketplace, deals, account, company and legal pages."
      />
      <Navbar />
      <main className="flex-1 container px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <header className="mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Site Map</h1>
          <p className="text-muted-foreground mt-2">
            All the pages on GOPARTARA, in one place.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-4 text-muted-foreground"
                style={{ letterSpacing: "0.1em" }}
              >
                {section.title}
              </h2>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      to={link.href}
                      className="text-foreground/90 hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sitemap;
