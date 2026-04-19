import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

const AffiliateDisclosure = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Affiliate Disclosure — GOPARTARA"
        description="Learn how GOPARTARA uses affiliate partnerships with eBay, Amazon, and Awin to keep our car parts search platform free."
        path="/affiliate-disclosure"
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container max-w-3xl px-4">
          <div className="mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Affiliate Disclosure
            </h1>
            <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                Our Commitment to Transparency
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                GOPARTARA (gopartara.com) participates in affiliate marketing programmes.
                This means we may earn a small commission when you click certain links on our
                site and make a purchase — at no extra cost to you.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">Which Programmes We Use</h2>
              <ul className="space-y-3 text-muted-foreground leading-relaxed">
                <li>
                  <strong className="text-foreground">eBay Partner Network</strong> — We link to
                  eBay UK listings and deals. When you purchase through our links, we may earn a
                  commission.
                </li>
                <li>
                  <strong className="text-foreground">Amazon Associates</strong> — We are a
                  participant in the Amazon UK Associates Programme. Tag: gopartara-21.
                </li>
                <li>
                  <strong className="text-foreground">Awin Affiliate Network</strong> — We work
                  with several tyre and car parts retailers through Awin, including mytyres.co.uk,
                  Tyres UK, neumaticos-online.es, Pneumatici IT, ReifenDirekt EE, and Green Spark
                  Plug Co.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">How This Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Affiliate commissions help us keep GOPARTARA free to use. They allow us to
                maintain and improve the platform, add more suppliers, and continue providing
                free price comparison tools to drivers across the UK and Europe.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our editorial content and search results are never influenced by
                affiliate relationships. We show results based on relevance and price, not commission rates.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">ASA &amp; FTC Compliance</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                In accordance with the UK Advertising Standards Authority (ASA) and US Federal
                Trade Commission (FTC) guidelines, we clearly disclose affiliate relationships
                wherever affiliate links appear on our platform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Phrases such as &quot;Affiliate link&quot;, &quot;We may earn a commission&quot;,
                and &quot;Affiliate deals&quot; identify content that may generate revenue for GOPARTARA.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">Questions?</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our affiliate relationships or this disclosure,
                please contact us at{" "}
                <a
                  href="mailto:info@gopartara.com"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  info@gopartara.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to GOPARTARA
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default AffiliateDisclosure;
