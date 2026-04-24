import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubscriptionPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Subscription Policy - GOPARTARA" description="GOPARTARA subscription policy: plans, billing, cancellation and refund information." path="/subscription-policy" />
      <Navbar />
      <div className="container max-w-3xl py-16 px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="font-display text-3xl font-bold mb-8">Subscription Policy</h1>

        <div className="prose prose-sm prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Plans &amp; Pricing</h2>
            <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
              <li><strong className="text-foreground">Free (£0/month)</strong> — 10 searches per month, up to 5 marketplace listings, save parts, 1 garage vehicle.</li>
              <li><strong className="text-foreground">Pro (£9.99/month)</strong> — Unlimited searches, photo search, unlimited marketplace listings, price alerts, unlimited garage vehicles, full search history.</li>
              <li><strong className="text-foreground">Elite (£19.99/month)</strong> — Everything in Pro plus CSV export, 30-day price tracking, vehicle notes, priority support, and early access to new features.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Billing Cycle</h2>
            <p className="text-sm text-muted-foreground">
              All subscriptions are billed monthly. Your billing date is the same day each month as your original signup date. Payments are processed automatically via Stripe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Cancellation Policy</h2>
            <p className="text-sm text-muted-foreground">
              You may cancel your subscription at any time from your Dashboard or via the Manage Subscription portal. Upon cancellation, your account is immediately downgraded to the Free plan and all premium features are removed. There is no prorated refund for partial months.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Refund Policy</h2>
            <p className="text-sm text-muted-foreground">
              We offer a <strong className="text-foreground">7-day money-back guarantee</strong> from the date of your first payment. If you are not satisfied, you can request a full refund within 7 days. Refunds are limited to one per user and are processed to your original payment method within 5-10 business days.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              To request a refund, visit the Refund page from your Dashboard or contact us directly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">How to Cancel or Request a Refund</h2>
            <ol className="space-y-2 text-muted-foreground text-sm list-decimal pl-5">
              <li>Log in to your GOPARTARA account.</li>
              <li>Go to your <strong className="text-foreground">Dashboard</strong>.</li>
              <li>Click <strong className="text-foreground">Manage Subscription</strong> to cancel, or <strong className="text-foreground">Request Refund</strong> if within 7 days.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Support</h2>
            <p className="text-sm text-muted-foreground">
              For any questions regarding your subscription, billing, or refunds, contact us at{" "}
              <a href="mailto:info@gopartara.com" className="text-primary hover:underline">info@gopartara.com</a>{" "}
              or visit our <button onClick={() => navigate("/contact")} className="text-primary hover:underline">Contact page</button>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionPolicy;
