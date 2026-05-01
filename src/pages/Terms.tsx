import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { FileText } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Terms of Service | GOPARTARA"
      description="Read GOPARTARA's terms of service. Understand the rules and guidelines for using our car parts search and comparison platform."
      path="/terms"
    />
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={28} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: 9 April 2026</p>
        </div>

        <article className="space-y-10">
          <Section title="1. Introduction">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the GOPARTARA website
              (<strong>gopartara.com</strong>) and application, operated by GOPARTARA ("we", "us", "our").
            </p>
            <p>
              By accessing or using GOPARTARA, you agree to be bound by these Terms. If you do not
              agree, you must not use our service. These Terms constitute a legally binding agreement
              between you and GOPARTARA.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              GOPARTARA is a car parts search, comparison, and marketplace platform. We aggregate listings from
              trusted UK &amp; global suppliers, and host a seller marketplace to help you find, compare, and purchase car parts.
            </p>
            <p><strong>Important:</strong></p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                For search results from external suppliers, we act as a <strong>comparison platform</strong> — all purchases are made directly with the supplier. We are not a party to transactions between you and external suppliers.
              </li>
              <li>
                The <strong>GOPARTARA Marketplace</strong> connects independent sellers with buyers. Transactions for marketplace listings are between you and the seller.
              </li>
              <li>
                We make reasonable efforts to display accurate information, but pricing, availability,
                and product details are sourced from suppliers and sellers, and may change without notice.
              </li>
              <li>
                Photo-based part identification uses advanced image recognition and is provided as a
                convenience. Results should be verified before purchasing.
              </li>
              <li>
                Vehicle registration lookups use the DVLA API to provide vehicle details for accurate part matching. This data is queried in real time and not stored.
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
            <p>GOPARTARA offers the following subscription tiers for users:</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <PlanCard
                name="Free"
                price="£0"
                features={["20 searches per month", "5 active marketplace listings", "Save up to 5 parts & alerts", "1 garage vehicle"]}
              />
              <PlanCard
                name="Pro"
                price="£9.99/mo"
                features={[
                  "Unlimited searches",
                  "Photo search",
                  "Unlimited marketplace listings",
                  "Unlimited parts & alerts",
                  "Unlimited garage vehicles",
                  "Search history",
                  "Price alerts",
                  "Ad-free experience",
                ]}
              />
              <PlanCard
                name="Elite"
                price="£19.99/mo"
                features={[
                  "Everything in Pro",
                  "Export search history CSV",
                  "30-day price tracking",
                  "Vehicle notes & history",
                  "Priority email support",
                  "Analytics dashboard",
                ]}
              />
            </div>

            <p className="mt-6 font-semibold text-foreground">Seller Plans</p>
            <p className="mt-1">For sellers listing on the GOPARTARA Marketplace:</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <PlanCard
                name="Basic Seller"
                price="£9.99/mo"
                features={["Up to 20 listings", "Basic analytics", "Standard visibility"]}
              />
              <PlanCard
                name="Featured Seller"
                price="£24.99/mo"
                features={[
                  "Up to 100 listings",
                  "Featured placement",
                  "Advanced analytics",
                  "Priority moderation",
                ]}
              />
              <PlanCard
                name="Pro Seller"
                price="£49.99/mo"
                features={[
                  "Unlimited listings",
                  "Top placement",
                  "Full analytics suite",
                  "Priority support",
                  "Verified seller badge",
                ]}
              />
            </div>

            <div className="mt-6 space-y-2">
              <p>
                <strong>Billing:</strong> All paid subscriptions are billed monthly via Stripe. By
                subscribing, you authorise us to charge your payment method on a recurring basis.
                Your card details are processed and stored securely by Stripe — we never have access to your full card number or CVV.
              </p>
              <p>
                <strong>Cancellation:</strong> You may cancel your subscription at any time through your dashboard or the Stripe Customer Portal. Access
                to paid features continues until the end of your current billing period. No
                partial-month refunds are given for cancellations.
              </p>
              <p>
                <strong>Downgrade:</strong> When you cancel a paid plan, your account reverts to the Free tier at the end of the billing period. Saved data exceeding Free tier limits will be retained for 30 days.
              </p>
              <p>
                <strong>Price changes:</strong> We may adjust subscription pricing with at least 30
                days' written notice. Continued use after the effective date constitutes acceptance.
              </p>
              <p>
                <strong>Refunds:</strong> Refund requests must be submitted within 7 days of your initial subscription payment. Refunds are not available after this period. You may request a refund from your{" "}
                <a href="/refund" className="text-primary hover:underline">
                  dashboard refund page
                </a>. Cancellation results in immediate loss of paid features. Each account is entitled to one refund only.
              </p>
              <p>
                <strong>Free trials:</strong> If offered, free trial terms will be clearly stated at
                sign-up. You will not be charged until the trial period ends.
              </p>
            </div>
          </Section>

          <Section title="5. Marketplace &amp; Commission Policy">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <p>All users may list up to 5 items for free. Pro and Elite members may list unlimited items.</p>
              <p>
                GOPARTARA Marketplace is currently commission-free. GOPARTARA reserves the right to introduce a
                commission fee on future sales. All active sellers will receive at least 30 days written notice
                before any commission is implemented.
              </p>
              <p>Featured listing promotions are available to all users as optional paid upgrades.</p>
            </div>
          </Section>

          <Section title="6. Marketplace Rules">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="font-semibold text-foreground mb-3">Seller Obligations</p>
              <p>By listing items on the GOPARTARA Marketplace, sellers agree to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>List only genuine automotive parts and accessories.</li>
                <li>Provide accurate descriptions, pricing, condition details, and clear photographs.</li>
                <li>Respond to buyer enquiries in a timely manner.</li>
                <li>Comply with all applicable UK consumer protection and trading standards laws.</li>
                <li>Not list counterfeit, stolen, recalled, or prohibited items.</li>
                <li>Accept that all listings are subject to automated and manual moderation before publication.</li>
              </ul>

              <p className="font-semibold text-foreground mt-5 mb-3">Prohibited Listings</p>
              <p>The following items may not be listed on the GOPARTARA Marketplace:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Counterfeit or replica parts marketed as genuine.</li>
                <li>Stolen goods or items without proof of ownership.</li>
                <li>Items subject to product recalls or safety bans.</li>
                <li>Non-automotive items or services unrelated to vehicle parts.</li>
                <li>Items that violate any applicable law or regulation.</li>
              </ul>

              <p className="font-semibold text-foreground mt-5 mb-3">Moderation</p>
              <p>
                All listings undergo automated moderation before publication. Listings that are flagged as suspicious are held for manual review. We reserve the right to reject or remove any listing at our sole discretion. Sellers will be notified of rejections with reasons provided.
              </p>
              <p className="mt-2">
                Edits to listing content (title, description, category, or photos) trigger re-moderation. Price-only updates are published immediately.
              </p>
            </div>
          </Section>

          <Section title="7. User Content &amp; Reviews">
            <p>Users may submit content including reviews, ratings, and comments. By submitting content, you:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Retain ownership of your original content.</li>
              <li>
                Grant GOPARTARA a non-exclusive, worldwide, royalty-free licence to use, display, reproduce, and distribute your content in connection with operating the platform.
              </li>
              <li>Confirm that your content is truthful, not defamatory, and does not infringe third-party rights.</li>
              <li>Acknowledge that we may remove content that violates these Terms or is reported as inappropriate.</li>
            </ul>
            <p className="mt-3">
              Seller listings remain the intellectual property of the seller. Upon account deletion, listing content is removed within 30 days.
            </p>
          </Section>

          <Section title="8. Affiliate Disclosure">
            <div className="rounded-xl border border-border bg-card p-6">
              <p>
                <strong>GOPARTARA earns affiliate commissions</strong> when you click through to a
                supplier's website and make a purchase. We participate in the following affiliate programmes:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  <strong>eBay Partner Network</strong> — we earn commissions on qualifying purchases made through eBay links on our platform. eBay sets tracking cookies when you click these links.
                </li>
                <li>
                  <strong>Amazon Associates Programme</strong> — as an Amazon Associate, we earn from qualifying purchases made through Amazon links. Amazon sets its own tracking cookies.
                </li>
                <li>
                  <strong>Other supplier affiliates</strong> — we may participate in additional affiliate programmes with automotive parts suppliers.
                </li>
              </ul>
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
                Trading Regulations 2008, ASA CAP Code, and the Amazon Associates Programme Operating Agreement.
              </p>
            </div>
          </Section>

          <Section title="9. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Use the service for any unlawful purpose or in violation of any applicable law.</li>
              <li>
                Scrape, crawl, spider, or use automated means to access GOPARTARA without our prior
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
                Use GOPARTARA to engage in price manipulation, fraudulent activity, or misrepresentation.
              </li>
              <li>
                Submit false reviews, fake listings, or misleading marketplace content.
              </li>
            </ul>
            <p className="mt-3">
              Violation of these rules may result in immediate suspension or termination of your
              account.
            </p>
          </Section>

          <Section title="10. Intellectual Property">
            <p>
              All content, design, branding, code, and technology comprising the GOPARTARA platform is
              owned by or licensed to GOPARTARA and is protected by UK and international
              intellectual property laws.
            </p>
            <p>
              Third-party supplier listings, logos, product images, and descriptions remain the
              property of their respective owners and are displayed under licence or fair use for
              comparison purposes.
            </p>
            <p>
              You may not copy, modify, distribute, or create derivative works from any part of
              GOPARTARA without our prior written consent.
            </p>
          </Section>

          <Section title="11. Disclaimer of Warranties">
            <p>
              GOPARTARA is provided on an <strong>"as is"</strong> and <strong>"as available"</strong>{" "}
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
                provided by third-party suppliers or marketplace sellers, including pricing, availability, and product
                specifications.
              </li>
              <li>
                Any warranty that photo-based part identification or DVLA vehicle lookups will be accurate or complete.
              </li>
              <li>
                Any warranty regarding the accuracy of price alert notifications or the timeliness of price tracking.
              </li>
            </ul>
            <p className="mt-3">
              Your statutory rights as a UK consumer are not affected by these disclaimers.
            </p>
          </Section>

          <Section title="12. Limitation of Liability">
            <div className="rounded-xl border border-border bg-card p-6">
              <p>
                To the maximum extent permitted by applicable law, GOPARTARA, its directors,
                employees, and agents shall not be liable for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Any <strong>indirect, incidental, special, consequential, or punitive damages</strong>,
                  including loss of profits, data, goodwill, or other intangible losses.
                </li>
                <li>
                  Any loss arising from your <strong>reliance on information</strong> displayed on our
                  platform, including pricing, availability, or product details sourced from suppliers or marketplace sellers.
                </li>
                <li>
                  Any loss arising from <strong>transactions with third-party suppliers or marketplace sellers</strong>,
                  including defective products, delivery issues, or payment disputes.
                </li>
                <li>
                  Any loss arising from <strong>unauthorised access</strong> to your account due to
                  your failure to maintain credential security.
                </li>
                <li>
                  Any loss arising from <strong>price alert inaccuracies</strong>, missed notifications, or delayed tracking.
                </li>
                <li>
                  Service interruptions, downtime, or data loss caused by circumstances beyond our
                  reasonable control.
                </li>
              </ul>
              <p className="mt-4">
                <strong>Cap on liability:</strong> Our total aggregate liability to you for any
                claims arising from or related to these Terms or your use of GOPARTARA shall not exceed
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

          <Section title="13. Indemnification">
            <p>
              You agree to indemnify and hold harmless GOPARTARA and its officers, directors,
              employees, and agents from any claims, losses, damages, liabilities, and expenses
              (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Your use of or conduct on the GOPARTARA platform.</li>
              <li>Your breach of these Terms or any applicable law.</li>
              <li>Your violation of any third party's rights.</li>
              <li>Content you submit, including reviews, listings, and marketplace content.</li>
            </ul>
          </Section>

          <Section title="14. Termination">
            <p>
              <strong>By you:</strong> You may delete your account at any time by contacting us at{" "}
              <a href="mailto:info@gopartara.com" className="text-primary hover:underline">
                info@gopartara.com
              </a>
              . Active subscriptions should be cancelled before account deletion.
            </p>
            <p>
              <strong>By us:</strong> We may suspend or terminate your account immediately if you
              breach these Terms, engage in fraudulent activity, violate marketplace rules, or if we are required to do so by
              law. We will provide notice where reasonably practicable.
            </p>
            <p>
              Upon termination, your right to use GOPARTARA ceases immediately. Active marketplace listings will be removed. Provisions that by
              their nature should survive termination (including limitation of liability,
              indemnification, and governing law) shall remain in effect.
            </p>
          </Section>

          <Section title="15. Third-Party Links &amp; Services">
            <p>
              GOPARTARA contains links to third-party supplier websites, including eBay and Amazon. We are not responsible for the
              content, accuracy, privacy practices, or policies of these external sites. Your use of
              third-party websites is governed by their own terms and conditions.
            </p>
            <p>
              We do not endorse, warrant, or guarantee any products or services offered by third-party
              suppliers or marketplace sellers displayed on our platform.
            </p>
          </Section>

          <Section title="16. Governing Law &amp; Jurisdiction">
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

          <Section title="17. Severability">
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable by a
              court of competent jurisdiction, that provision shall be modified to the minimum extent
              necessary or severed, and the remaining provisions shall continue in full force and
              effect.
            </p>
          </Section>

          <Section title="18. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be
              communicated via email or a prominent notice on our website at least 30 days before
              they take effect. Your continued use of GOPARTARA after changes become effective
              constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="19. Contact Us">
            <p>If you have questions about these Terms, please contact us:</p>
            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <p className="font-semibold mb-1">GOPARTARA</p>
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
    <BackToTop />
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
