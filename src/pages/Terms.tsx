import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <article className="container px-4 max-w-3xl mx-auto prose prose-invert prose-sm prose-headings:font-display">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: 7 April 2026</p>

        <h2>1. Introduction</h2>
        <p>
          These Terms of Service ("Terms") govern your use of the PARTARA website and application
          operated by Partara Ltd, a company registered in England and Wales. By using our service,
          you agree to these Terms.
        </p>

        <h2>2. Service Description</h2>
        <p>
          PARTARA is a car parts search engine that aggregates listings from third-party suppliers.
          We do not sell parts directly. We provide search, comparison, and linking services to help
          you find parts from external suppliers.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible for
          maintaining the confidentiality of your login credentials and for all activity under your
          account.
        </p>

        <h2>4. Subscriptions &amp; Payments</h2>
        <ul>
          <li>Free accounts have limited searches per month.</li>
          <li>Paid plans (Pro, Business) are billed monthly or annually via Stripe.</li>
          <li>You may cancel at any time; access continues until the end of your billing period.</li>
          <li>Refunds are handled on a case-by-case basis in accordance with UK consumer law.</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose.</li>
          <li>Scrape, crawl, or automate access to our platform without permission.</li>
          <li>Attempt to gain unauthorised access to our systems.</li>
          <li>Upload malicious content or interfere with other users' experience.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          All content, design, and code on the PARTARA platform is owned by Partara Ltd unless
          otherwise stated. Third-party supplier listings remain the property of their respective
          owners.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          PARTARA is provided "as is". We make reasonable efforts to ensure accuracy but do not
          guarantee that search results, pricing, or availability information from third-party
          suppliers is complete or up to date. Purchasing decisions are made at your own risk.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Partara Ltd shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of the service. Nothing in
          these Terms excludes liability for death, personal injury, or fraud.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your account if you breach these Terms. You may delete your
          account at any time by contacting us at{" "}
          <a href="mailto:info@gopartara.com">info@gopartara.com</a>.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of England and Wales. Any disputes shall be subject
          to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the service after changes
          constitutes acceptance of the updated Terms.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href="mailto:info@gopartara.com">info@gopartara.com</a>.
        </p>
      </article>
    </main>
    <Footer />
  </div>
);

export default Terms;
