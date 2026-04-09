import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Shield } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Privacy Policy | PARTARA"
      description="Read PARTARA's privacy policy. Learn how we collect, use, and protect your personal data in compliance with UK GDPR."
      path="/privacy"
    />
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield size={28} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: 9 April 2026</p>
        </div>

        <article className="space-y-10">
          <Section title="1. Who We Are">
            <p>
              PARTARA ("we", "us", "our") is a UK-based car parts search engine. We operate the website{" "}
              <strong>gopartara.com</strong> and the PARTARA application.
            </p>
            <p>
              <strong>Data Controller:</strong> PARTARA
              <br />
              <strong>Contact:</strong>{" "}
              <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                info@gopartara.com
              </a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <DataCard
                label="Account Information"
                detail="Email address, display name, and profile avatar when you create an account."
              />
              <DataCard
                label="Search &amp; Usage Data"
                detail="Search queries, uploaded part images, pages visited, browser type, device information, and IP address."
              />
              <DataCard
                label="Saved Parts &amp; Price Alerts"
                detail="Part names, numbers, prices, supplier details you save, and email addresses provided for price drop notifications."
              />
              <DataCard
                label="Payment Data"
                detail="Processed securely by Stripe. We never store your card number, CVV, or full payment details on our servers. Stripe may store tokenised payment methods for recurring billing."
              />
              <DataCard
                label="Vehicle Data"
                detail="Vehicle registration numbers submitted for lookup via the DVLA API. Registration data is used for real-time queries only and is not permanently stored."
              />
              <DataCard
                label="Marketplace &amp; Seller Data"
                detail="Business name, contact details, listing content, photos, and pricing submitted by sellers on the PARTARA Marketplace."
              />
              <DataCard
                label="Contact Form Data"
                detail="Your name, email, and message when you contact us via our website."
              />
              <DataCard
                label="Cookies &amp; Analytics"
                detail="Essential, functional, affiliate tracking, and (with consent) analytics cookies. See Section 8."
              />
            </div>
          </Section>

          <Section title="3. Legal Basis for Processing (UK GDPR)">
            <p>We process your personal data under the following lawful bases:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong>Performance of a contract</strong> — to provide the PARTARA service you signed
                up for, manage your account, process subscriptions via Stripe, and deliver price alert notifications.
              </li>
              <li>
                <strong>Legitimate interests</strong> — to improve and secure our service, analyse usage
                patterns via Google Analytics, prevent fraud, moderate marketplace listings, and respond to enquiries.
              </li>
              <li>
                <strong>Consent</strong> — for optional marketing communications, analytics cookies, and
                affiliate tracking cookies (eBay, Amazon). You may withdraw consent at any time.
              </li>
              <li>
                <strong>Legal obligation</strong> — to comply with applicable UK laws, regulations, and
                lawful requests.
              </li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve the PARTARA search engine and related features.</li>
              <li>To process your searches and deliver comparison results from our supplier network.</li>
              <li>To manage your account, saved parts, and subscription plan.</li>
              <li>To identify car parts from uploaded photos using image recognition technology.</li>
              <li>To look up vehicle details using registration numbers via the DVLA API for accurate part matching.</li>
              <li>To send price alert notifications when tracked parts drop below your target price.</li>
              <li>To process subscription payments and manage billing through Stripe.</li>
              <li>To operate the PARTARA Marketplace, including listing moderation, seller verification, and buyer notifications.</li>
              <li>To send transactional emails (e.g., contact confirmations, password resets, listing approvals).</li>
              <li>To track affiliate referrals through eBay Partner Network and Amazon Associates when you click through to make purchases.</li>
              <li>To communicate service updates and, with your consent, promotional content.</li>
              <li>To monitor and improve website security and performance.</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing &amp; Third Parties">
            <p>
              <strong>We do not sell your personal data.</strong> We share data only with trusted
              service providers who help us operate, and only to the extent necessary:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Payment processing</strong> — Stripe processes all payments securely. Your card details are handled entirely by Stripe and never touch our servers. Stripe is PCI DSS Level 1 certified.</li>
              <li><strong>Vehicle data</strong> — the DVLA API is used for vehicle registration lookups. Registration numbers are sent to the DVLA for real-time queries only; we do not store this data.</li>
              <li><strong>Analytics</strong> — Google Analytics (with consent) to understand visitor behaviour and usage patterns. We use anonymised IP addresses where possible.</li>
              <li><strong>Affiliate networks</strong> — eBay Partner Network and Amazon Associates receive click and referral data when you follow affiliate links. These networks set their own cookies subject to their privacy policies.</li>
              <li><strong>Email delivery</strong> — to send transactional, price alert, and service-related emails.</li>
              <li><strong>Hosting &amp; infrastructure</strong> — cloud hosting providers for data storage and processing.</li>
              <li><strong>Automated systems</strong> — for image-based part identification and automated listing moderation. No personal data is shared beyond the content being analysed.</li>
            </ul>
            <p className="mt-3">
              All third-party processors are bound by data processing agreements and are required to
              protect your data in accordance with UK GDPR.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account data</strong> — retained for as long as your account is active. Upon
                deletion, your data is removed within 30 days.
              </li>
              <li>
                <strong>Search history</strong> — retained for 12 months, then automatically deleted.
              </li>
              <li>
                <strong>Price alerts</strong> — retained while active. Triggered or deactivated alerts are retained for 6 months for reference, then deleted.
              </li>
              <li>
                <strong>Marketplace listings</strong> — seller listings and associated data are retained while the seller account is active. Removed listings are deleted within 30 days.
              </li>
              <li>
                <strong>Vehicle lookup data</strong> — registration numbers are used for real-time DVLA queries only and are not permanently stored.
              </li>
              <li>
                <strong>Contact form submissions</strong> — retained for up to 24 months for support
                follow-up purposes.
              </li>
              <li>
                <strong>Payment records</strong> — retained as required by UK tax and financial
                regulations (typically 6 years).
              </li>
            </ul>
            <p className="mt-3">
              You can request deletion of your data at any time by contacting us.
            </p>
          </Section>

          <Section title="7. Your Rights Under UK GDPR">
            <p>You have the following rights regarding your personal data:</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <RightCard title="Right of Access" desc="Request a copy of the personal data we hold about you." />
              <RightCard title="Right to Rectification" desc="Request correction of inaccurate or incomplete data." />
              <RightCard title="Right to Erasure" desc="Request deletion of your data ('right to be forgotten')." />
              <RightCard title="Right to Restrict Processing" desc="Request that we limit how we use your data." />
              <RightCard title="Right to Data Portability" desc="Receive your data in a structured, machine-readable format." />
              <RightCard title="Right to Object" desc="Object to processing based on legitimate interests or direct marketing." />
              <RightCard title="Right to Withdraw Consent" desc="Withdraw consent at any time where processing is consent-based." />
              <RightCard
                title="Right to Complain"
                desc="Lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk."
              />
            </div>
            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                info@gopartara.com
              </a>
              . We will respond within one month as required by UK GDPR.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>We use the following types of cookies:</p>
            <div className="mt-4 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card">
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Consent Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium">Essential</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Authentication, security, and core functionality. Required for the site to work.
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Functional</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Remembering preferences, theme settings, and display options.
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Analytics</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Google Analytics (ID: G-YRZ3243HF0) — helps us understand how visitors use the site to improve our service. IP addresses are anonymised.
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Affiliate</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      eBay Partner Network and Amazon Associates cookies used to track referrals when you click through to purchase parts. These cookies are set by the respective affiliate networks.
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Payment</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Stripe uses cookies for fraud prevention and secure payment processing.
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              We do not use third-party advertising or behavioural targeting cookies. You can manage cookie
              preferences through your browser settings or our cookie consent banner at any time.
            </p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>
              Some of our service providers may process data outside the United Kingdom. Where this
              occurs, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong>UK adequacy decisions</strong> — transfers to countries recognised as providing
                adequate data protection.
              </li>
              <li>
                <strong>International Data Transfer Agreement (IDTA)</strong> or{" "}
                <strong>Standard Contractual Clauses (SCCs)</strong> — contractual safeguards approved by
                the ICO.
              </li>
            </ul>
            <p className="mt-3">
              Stripe (US), Google Analytics (US), eBay (US), and Amazon (US) all maintain appropriate data transfer mechanisms as required by UK GDPR.
            </p>
          </Section>

          <Section title="10. Data Security">
            <p>
              We implement appropriate technical and organisational measures to protect your personal
              data, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Encryption in transit (TLS/SSL) and at rest.</li>
              <li>Access controls and role-based permissions.</li>
              <li>Regular security reviews and vulnerability assessments.</li>
              <li>Secure payment processing via PCI DSS-compliant Stripe.</li>
              <li>Automated content moderation for marketplace listings.</li>
              <li>Row-level security on database tables to ensure users can only access their own data.</li>
            </ul>
          </Section>

          <Section title="11. Children's Privacy">
            <p>
              PARTARA is not directed at individuals under the age of 13. We do not knowingly collect
              personal data from children. If we become aware that we have collected data from a child
              under 13, we will take steps to delete it promptly.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or legal requirements. We will notify you of significant changes via email or a
              prominent notice on our website. The "Last updated" date at the top indicates when this
              policy was last revised.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, wish to exercise your data rights,
              or have a complaint, please contact us:
            </p>
            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <p className="font-semibold mb-1">PARTARA</p>
              <p className="text-sm text-muted-foreground">
                Email:{" "}
                <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                  info@gopartara.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You also have the right to lodge a complaint with the{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Information Commissioner's Office (ICO)
                </a>
                .
              </p>
            </div>
          </Section>
        </article>
      </div>
    </main>
    <Footer />
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="font-display text-xl md:text-2xl font-bold mb-4">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </section>
);

const DataCard = ({ label, detail }: { label: string; detail: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="font-semibold text-sm mb-1 text-foreground">{label}</p>
    <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
  </div>
);

const RightCard = ({ title, desc }: { title: string; desc: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="font-semibold text-sm mb-1 text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

export default Privacy;
