import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <article className="container px-4 max-w-3xl mx-auto prose prose-invert prose-sm prose-headings:font-display">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: 7 April 2026</p>

        <h2>1. Who We Are</h2>
        <p>
          Partara Ltd ("we", "us", "our") is a company registered in England and Wales. We operate
          the website <strong>gopartara.com</strong> and the PARTARA application. Our contact email
          is <a href="mailto:info@gopartara.com">info@gopartara.com</a>.
        </p>

        <h2>2. What Data We Collect</h2>
        <ul>
          <li><strong>Account data</strong> — email address, display name, and avatar when you create an account.</li>
          <li><strong>Search data</strong> — search queries and uploaded images used to find parts.</li>
          <li><strong>Saved parts</strong> — parts you choose to save for later.</li>
          <li><strong>Usage data</strong> — pages visited, browser type, and IP address collected automatically via server logs.</li>
          <li><strong>Payment data</strong> — processed securely by our payment provider (Stripe). We do not store card details.</li>
        </ul>

        <h2>3. Legal Basis for Processing (UK GDPR)</h2>
        <p>We process your data under the following lawful bases:</p>
        <ul>
          <li><strong>Contract</strong> — to provide the service you signed up for.</li>
          <li><strong>Legitimate interests</strong> — to improve our service and prevent fraud.</li>
          <li><strong>Consent</strong> — for optional marketing communications (you can withdraw at any time).</li>
        </ul>

        <h2>4. How We Use Your Data</h2>
        <ul>
          <li>To provide, maintain, and improve the PARTARA service.</li>
          <li>To process your searches and deliver results.</li>
          <li>To manage your account and subscription.</li>
          <li>To communicate service updates and, with consent, promotional content.</li>
        </ul>

        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your personal data. We share data only with trusted service providers who
          help us operate (e.g., hosting, payment processing, analytics), and only to the extent
          necessary. All processors are bound by data processing agreements.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. Search history is
          retained for 12 months. You can request deletion at any time by contacting us.
        </p>

        <h2>7. Your Rights</h2>
        <p>Under UK GDPR you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Rectify inaccurate data.</li>
          <li>Erase your data ("right to be forgotten").</li>
          <li>Restrict or object to processing.</li>
          <li>Data portability.</li>
          <li>Withdraw consent at any time.</li>
          <li>Lodge a complaint with the Information Commissioner's Office (ICO).</li>
        </ul>

        <h2>8. Cookies</h2>
        <p>
          We use essential cookies to keep you signed in and functional cookies for preferences. We
          do not use third-party advertising cookies. Analytics cookies are only set with your
          consent.
        </p>

        <h2>9. International Transfers</h2>
        <p>
          Some of our service providers may process data outside the UK. Where this happens, we
          ensure appropriate safeguards are in place (e.g., Standard Contractual Clauses).
        </p>

        <h2>10. Security</h2>
        <p>
          We implement industry-standard security measures including encryption in transit (TLS),
          access controls, and regular security reviews to protect your data.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of significant changes
          via email or an in-app notice.
        </p>

        <h2>12. Contact</h2>
        <p>
          For any privacy-related queries, please contact us at{" "}
          <a href="mailto:info@gopartara.com">info@gopartara.com</a>.
        </p>
      </article>
    </main>
    <Footer />
  </div>
);

export default Privacy;
