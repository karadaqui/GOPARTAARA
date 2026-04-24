import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Lock, Star } from "lucide-react";

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

const TRUST_BADGES = [
  { icon: <Lock size={11} className="text-zinc-400" />, label: "Secure · SSL Encrypted" },
  { icon: <span className="text-[11px] leading-none">🇬🇧</span>, label: "UK Based" },
  { icon: <Star size={11} className="text-zinc-400" />, label: "Trusted by 50,000+ users" },
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
    <footer className="bg-[#080808] border-t border-[#1f1f1f]">
      <div className="container px-4 md:px-6 lg:px-8 py-14 md:py-16">
        {/* TOP: brand + trust badges */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-12 border-b border-[#1f1f1f]">
          <div className="max-w-[280px]">
            <button onClick={() => handleLink("/")} className="inline-block">
              <span className="logo-text text-xl">
                <span className="logo-go">GO</span>
                <span className="logo-part">PART</span>
                <span className="logo-ara">ARA</span>
              </span>
            </button>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
              The smarter way to find and compare car parts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 bg-zinc-800/60 text-zinc-400 rounded-full px-3 py-1 text-xs font-medium"
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* MIDDLE: 4-column links grid (desktop) */}
        <div className="hidden md:grid grid-cols-4 gap-8 py-12">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-zinc-300 font-semibold text-[13px] mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLink(link.href)}
                      className="text-[13px] text-zinc-500 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile: collapsible accordion */}
        <div className="md:hidden divide-y divide-[#1f1f1f] border-b border-[#1f1f1f]">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between py-4 min-h-[48px] text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-[13px] text-zinc-300">
                    {section.title}
                  </span>
                  {isOpen ? (
                    <Minus size={16} className="text-zinc-500" />
                  ) : (
                    <Plus size={16} className="text-zinc-500" />
                  )}
                </button>
                {isOpen && (
                  <ul className="pb-4 space-y-1">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <button
                          onClick={() => handleLink(link.href)}
                          className="block w-full text-left py-2 min-h-[44px] text-[13px] text-zinc-500 hover:text-white transition-colors duration-150"
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

        {/* BOTTOM BAR */}
        <div className="border-t border-[#1f1f1f] mt-8 md:mt-0 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="text-[12px] text-zinc-600">
            © 2026 GOPARTARA Ltd. All rights reserved.
          </span>
          <span className="text-[12px] text-zinc-600">
            Prices from third-party suppliers. We may earn a commission.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
