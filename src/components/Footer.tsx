import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Plus, Minus } from "lucide-react";

type FooterSection = {
  title: string;
  links: { label: string; href: string }[];
};

const SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Search", href: "/" },
      { label: "Tyres", href: "/tyres" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Deals", href: "/deals" },
      { label: "My Garage", href: "/garage" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "For Business", href: "/business" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/contact" },
      { label: "Refund Policy", href: "/refund" },
      { label: "Report an Issue", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Subscription Policy", href: "/subscription-policy" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
    ],
  },
];

const Footer = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4 md:px-6 lg:px-8">
        {/* Logo + description (always visible) */}
        <div className="mb-8 md:mb-12 md:grid md:grid-cols-5 md:gap-8">
          <div className="md:col-span-1">
            <button onClick={() => handleLink("/")} className="inline-block min-h-[44px]">
              <span className="logo-text text-xl">
                <span className="logo-go">GO</span>
                <span className="logo-part">PART</span>
                <span className="logo-ara">ARA</span>
              </span>
            </button>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              The smarter way to find car parts. Search 1,000,000+ parts from trusted UK &amp; global suppliers.
            </p>
          </div>

          {/* Desktop: 4 columns */}
          <div className="hidden md:contents">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => handleLink(link.href)}
                        className="hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: collapsible accordion */}
        <div className="md:hidden divide-y divide-border border-y border-border mb-8">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between py-4 min-h-[48px] text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm">{section.title}</span>
                  {isOpen ? (
                    <Minus size={16} className="text-muted-foreground" />
                  ) : (
                    <Plus size={16} className="text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <ul className="pb-4 space-y-1 text-sm text-muted-foreground">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <button
                          onClick={() => handleLink(link.href)}
                          className="block w-full text-left py-2 min-h-[44px] hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
            <span className="text-xs text-muted-foreground">© 2026 GOPARTARA Ltd. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">info@gopartara.com</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://gopartara.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a
              href="https://gopartara.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors"
              aria-label="TikTok"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[18px] h-[18px] text-muted-foreground group-hover:text-primary transition-colors"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
