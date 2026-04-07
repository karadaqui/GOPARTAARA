const Footer = () => (
  <footer id="contact" className="border-t border-border py-12">
    <div className="container px-4">
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <a href="#home" className="font-display text-xl font-bold tracking-tight">
            <span className="text-primary">PART</span>ARA
          </a>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            The smarter way to find car parts. Searching across trusted UK and global suppliers.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#search" className="hover:text-foreground transition-colors">Search</a></li>
            <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
            <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© 2026 Partara Ltd. All rights reserved.</span>
        <span>hello@gopartara.com</span>
      </div>
    </div>
  </footer>
);

export default Footer;
