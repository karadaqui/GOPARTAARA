import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Footer = () => {
  const navigate = useNavigate();

  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  const socialIcons = [
    { name: "TikTok", icon: "🎵" },
    { name: "Instagram", icon: "📸" },
    { name: "YouTube", icon: "▶️" },
    { name: "X", icon: "𝕏" },
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
          
          <div className="flex items-center gap-3">
            {socialIcons.map((social) => (
              <Tooltip key={social.name}>
                <TooltipTrigger asChild>
                  <span
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 opacity-50 cursor-default select-none"
                    aria-label={`${social.name} — Coming Soon`}
                  >
                    <span className="text-base">{social.icon}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{social.name} — Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
