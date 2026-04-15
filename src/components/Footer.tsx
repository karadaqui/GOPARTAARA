import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  const socialIcons = [
    {
      name: "TikTok",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.79 1.52V6.76a4.85 4.85 0 01-1.02-.07z"/>
        </svg>
      ),
    },
    {
      name: "Instagram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: "YouTube",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      name: "X",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div>
            <button onClick={() => handleLink("/")} className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">PART</span>ARA
            </button>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              The smarter way to find car parts. Search 1,000,000+ parts from trusted UK &amp; global suppliers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/")} className="hover:text-foreground transition-colors">Search</button></li>
              <li><button onClick={() => handleLink("/marketplace")} className="hover:text-foreground transition-colors">Marketplace</button></li>
              <li><button onClick={() => handleLink("/garage")} className="hover:text-foreground transition-colors">My Garage</button></li>
              <li><button onClick={() => handleLink("/saved")} className="hover:text-foreground transition-colors">Saved Parts</button></li>
              <li><button onClick={() => handleLink("/blog")} className="hover:text-foreground transition-colors">Blog</button></li>
              <li><button onClick={() => handleLink("/pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/about")} className="hover:text-foreground transition-colors">About</button></li>
              <li><button onClick={() => handleLink("/blog")} className="hover:text-foreground transition-colors">Blog</button></li>
              <li><button onClick={() => handleLink("/contact")} className="hover:text-foreground transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/contact")} className="hover:text-foreground transition-colors">Help Center</button></li>
              <li><button onClick={() => handleLink("/refund")} className="hover:text-foreground transition-colors">Refund Policy</button></li>
              <li>
                <a href="mailto:info@gopartara.com" className="hover:text-foreground transition-colors">
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => handleLink("/privacy")} className="hover:text-foreground transition-colors">Cookie Policy</button></li>
              <li><button onClick={() => handleLink("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button></li>
              <li><button onClick={() => handleLink("/subscription-policy")} className="hover:text-foreground transition-colors">Subscription Policy</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground">© 2026 Partara Ltd. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">info@gopartara.com</span>
          </div>
          
          <div className="flex items-center gap-2">
            {socialIcons.map((social) => (
              <div key={social.name} className="relative group">
                <div className="w-9 h-9 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-muted-foreground/40 cursor-not-allowed pointer-events-none">
                  {social.icon}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded-lg text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Coming Soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
