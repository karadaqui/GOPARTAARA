import { useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

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
              <li><button onClick={() => handleLink("/contact")} className="hover:text-foreground transition-colors">Report an Issue</button></li>
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
          
          <div className="flex items-center gap-3">
            <a 
              href="https://gopartara.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Coming soon
              </span>
            </a>
            <a 
              href="https://gopartara.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors"
              aria-label="TikTok"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-[18px] h-[18px] text-muted-foreground group-hover:text-primary transition-colors"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Coming soon
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
