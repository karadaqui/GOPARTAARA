import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleLink = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <button onClick={() => handleLink("/")} className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">PART</span>ARA
            </button>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              The smarter way to find car parts. Searching across trusted UK and global suppliers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/")} className="hover:text-foreground transition-colors">Search</button></li>
              <li><button onClick={() => handleLink("/pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/about")} className="hover:text-foreground transition-colors">About</button></li>
              <li><button onClick={() => handleLink("/contact")} className="hover:text-foreground transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleLink("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => handleLink("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 Partara Ltd. All rights reserved.</span>
          <span>info@gopartara.com</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
