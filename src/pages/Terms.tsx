import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={28} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: 7 April 2026</p>
        </div>

        <article className="space-y-10">
          <Section title="1. Introduction">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the PARTARA website
              (<strong>gopartara.com</strong>) and application, operated by Partara Ltd, a company
              registered in England and Wales ("we", "us", "our").
            </p>
            <p>
              By accessing or using PARTARA, you agree to be bound by these Terms. If you do not
              agree, you must not use our service. These Terms constitute a legally binding agreement
              between you and Partara Ltd.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              PARTARA is a car parts search and comparison engine. We aggregate listings from 15+
              trusted UK and global suppliers to help you find, compare, and purchase car parts.
            </p>
            <p><strong>Important:</strong></p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                We do <strong>not</strong> sell car parts directly. We are a search and comparison
                platform that connects you with third-party suppliers.
              </li>
              <li>
                All purchases are made directly with the supplier. We are not a party to any
                transaction between you and a supplier.
              </li>
              <li>
                We make reasonable efforts to display accurate information, but pricing, availability,
                and product details are sourced from suppliers and may change without notice.
              </li>
              <li>
                Photo-based part identification uses advanced image recognition and is provided as a
                convenience. Results should be verified before purchasing.
              </li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <p>To access certain features, you must create an account. By registering, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and update your information to keep it accurate.</li>
              <li>
                Keep your login credentials confidential and notify us immediately of any
                unauthorised access.
              </li>
              <li>
                Accept responsibility for all activities that occur under your account.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that provide false information or
              violate these Terms.
            </p>
          </Section>

          <Section title="4. Subscription Plans &amp; Payments">
            <p>PARTARA offers the following subscription tiers:</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <PlanCard
                name="Free"
                price="£0"
                features={["5 searches per month", "Basic part comparison", "Save up to 10 parts"]}
              />
              <PlanCard
                name="Pro"
                price="£9.99/mo"
                features={[
                  "Unlimited searches",
                  "Photo-based part identification",
                  "Unlimited saved parts",
                  "Search history",
                ]}
              />
              <PlanCard
                name="Business"
                price="£24.99/mo"
                features={[
                  "Everything in Pro",
                  "Priority support",
                  "API access",
                  "Team management",
                ]}
              />
            </div>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Billing:</strong> Paid subscriptions are billed monthly via Stripe. By
                subscribing, you authorise us to charge your payment method on a recurring basis.
              </p>
              <p>
                <strong>Cancellation:</strong> You may cancel your subscription at any time. Access
                to paid features continues until the end of your current billing period. No
                partial-month refunds are given for cancellations.
              </p>
              <p>
                <strong>Price changes:</strong> We may adjust subscription pricing with at least 30
                days' written notice. Continued use after the effective date constitutes acceptance.
              </p>
              <p>
                <strong>Refunds:</strong> Refunds are considered on a case-by-case basis in
                accordance with the UK Consumer Rights Act 2015. If you believe you are entitled to a
                refund, contact us at{" "}
                <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                  info@gopartara.com
                </a>.
              </p>
              <p>
                <strong>Free trials:</strong> If offered, free trial terms will be clearly stated at
                sign-up. You will not be charged until the trial period ends.
              </p>
            </div>
          </Section>

          <Section title="5. Affiliate Disclosure">
            <div className="rounded-xl border border-border bg-card p-6">
              <p>
                <strong>PARTARA may earn affiliate commissions</strong> when you click through to a
                supplier's website and make a purchase. This means some of the links on our platform
                are affiliate links.
              </p>
              <p className="mt-3">
                <strong>How this affects you:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  You pay the <strong>same price</strong> whether or not we receive a commission.
                  Affiliate relationships do not increase the cost to you.
                </li>
                <li>
                  Affiliate relationships <strong>do not influence</strong> the order or ranking of
                  search results. Results are sorted by relevance, price, or your chosen criteria.
                </li>
                <li>
                  We clearly indicate when results include affiliate links where required by law or
                  regulation.
                </li>
              </ul>
              <p className="mt-3 text-xs">
                This disclosure is made in compliance with the UK Consumer Protection from Unfair
                Trading Regulations 2008 and ASA CAP Code.
              </p>
            </div>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Use the service for any unlawful purpose or in violation of any applicable law.</li>
              <li>
                Scrape, crawl, spider, or use automated means to access PARTARA without our prior
                written consent.
              </li>
              <li>
                Attempt to gain unauthorised access to our systems, networks, or other users'
                accounts.
              </li>
              <li>Upload malicious code, viruses, or content designed to disrupt the service.</li>
              <li>Interfere with or disrupt other users' experience on the platform.</li>
              <li>
                Reproduce, redistribute, or commercially exploit any part of our service without
                permission.
              </li>
              <li>
                Use PARTARA to engage in price manipulation, fraudulent activity, or misrepresentation.
              </li>
            </ul>
            <p className="mt-3">
              Violation of these rules may result in immediate suspension or termination of your
              account.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              All content, design, branding, code, and technology comprising the PARTARA platform is
              owned by or licensed to Partara Ltd and is protected by UK and international
              intellectual property laws.
            </p>
            <p>
              Third-party supplier listings, logos, product images, and descriptions remain the
              property of their respective owners and are displayed under licence or fair use for
              comparison purposes.
            </p>
            <p>
              You may not copy, modify, distribute, or create derivative works from any part of
              PARTARA without our prior written consent.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              PARTARA is provided on an <strong>"as is"</strong> and <strong>"as available"</strong>{" "}
              basis. To the fullest extent permitted by law, we disclaim all warranties, express or
              implied, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                Warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </li>
              <li>
                Any warranty that the service will be uninterrupted, timely, secure, or error-free.
              </li>
              <li>
                Any warranty regarding the accuracy, reliability, or completeness of information
                provided by third-party suppliers, including pricing, availability, and product
                specifications.
              </li>
              <li>
                Any warranty that photo-based part identification will be accurate or complete.
              </li>
            </ul>
            <p className="mt-3">
              Your statutory rights as a UK consumer are not affected by these disclaimers.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <div className="rounded-xl border border-border bg-card p-6">
              <p>
                To the maximum extent permitted by applicable law, Partara Ltd, its directors,
                employees, and agents shall not be liable for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Any <strong>indirect, incidental, special, consequential, or punitive damages</strong>,
                  including loss of profits, data, goodwill, or other intangible losses.
                </li>
                <li>
                  Any loss arising from your <strong>reliance on information</strong> displayed on our
                  platform, including pricing, availability, or product details sourced from suppliers.
                </li>
                <li>
                  Any loss arising from <strong>transactions with third-party suppliers</strong>,
                  including defective products, delivery issues, or payment disputes.
                </li>
                <li>
                  Any loss arising from <strong>unauthorised access</strong> to your account due to
                  your failure to maintain credential security.
                </li>
                <li>
                  Service interruptions, downtime, or data loss caused by circumstances beyond our
                  reasonable control.
                </li>
              </ul>
              <p className="mt-4">
                <strong>Cap on liability:</strong> Our total aggregate liability to you for any
                claims arising from or related to these Terms or your use of PARTARA shall not exceed
                the greater of (a) the total fees you paid us in the 12 months preceding the claim,
                or (b) £100.
              </p>
              <p className="mt-3">
                <strong>Nothing in these Terms excludes or limits our liability for:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Death or personal injury caused by our negligence.</li>
                <li>Fraud or fraudulent misrepresentation.</li>
                <li>Any liability that cannot be excluded or limited under UK law.</li>
              </ul>
            </div>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify and hold harmless Partara Ltd and its officers, directors,
              employees, and agents from any claims, losses, damages, liabilities, and expenses
              (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Your use of or conduct on the PARTARA platform.</li>
              <li>Your breach of these Terms or any applicable law.</li>
              <li>Your violation of any third party's rights.</li>
            </ul>
          </Section>

          <Section title="11. Termination">
            <p>
              <strong>By you:</strong> You may delete your account at any time by contacting us at{" "}
              <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                info@gopartara.com
              </a>
              . Active subscriptions should be cancelled before account deletion.
            </p>
            <p>
              <strong>By us:</strong> We may suspend or terminate your account immediately if you
              breach these Terms, engage in fraudulent activity, or if we are required to do so by
              law. We will provide notice where reasonably practicable.
            </p>
            <p>
              Upon termination, your right to use PARTARA ceases immediately. Provisions that by
              their nature should survive termination (including limitation of liability,
              indemnification, and governing law) shall remain in effect.
            </p>
          </Section>

          <Section title="12. Third-Party Links &amp; Services">
            <p>
              PARTARA contains links to third-party supplier websites. We are not responsible for the
              content, accuracy, privacy practices, or policies of these external sites. Your use of
              third-party websites is governed by their own terms and conditions.
            </p>
            <p>
              We do not endorse, warrant, or guarantee any products or services offered by third-party
              suppliers displayed on our platform.
            </p>
          </Section>

          <Section title="13. Governing Law &amp; Jurisdiction">
            <div className="rounded-xl border border-border bg-card p-6">
              <p>
                These Terms shall be governed by and construed in accordance with the{" "}
                <strong>laws of England and Wales</strong>.
              </p>
              <p className="mt-3">
                Any disputes arising out of or in connection with these Terms shall be subject to the{" "}
                <strong>exclusive jurisdiction of the courts of England and Wales</strong>.
              </p>
              <p className="mt-3">
                If you are a consumer, you may also have the right to bring proceedings in the courts
                of the country in which you reside. Nothing in these Terms affects your statutory
                rights under UK consumer protection legislation.
              </p>
            </div>
          </Section>

          <Section title="14. Severability">
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable by a
              court of competent jurisdiction, that provision shall be modified to the minimum extent
              necessary or severed, and the remaining provisions shall continue in full force and
              effect.
            </p>
          </Section>

          <Section title="15. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be
              communicated via email or a prominent notice on our website at least 30 days before
              they take effect. Your continued use of PARTARA after changes become effective
              constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="16. Contact Us">
            <p>If you have questions about these Terms, please contact us:</p>
            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <p className="font-semibold mb-1">Partara Ltd</p>
              <p className="text-sm text-muted-foreground">
                Email:{" "}
                <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                  info@gopartara.com
                </a>
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

const PlanCard = ({
  name,
  price,
  features,
}: {
  name: string;
  price: string;
  features: string[];
}) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <p className="font-bold text-foreground">{name}</p>
    <p className="text-primary font-semibold text-lg mt-1">{price}</p>
    <ul className="mt-3 space-y-1">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
          {f}
        </li>
      ))}
    </ul>
  </div>
);

export default Terms;
