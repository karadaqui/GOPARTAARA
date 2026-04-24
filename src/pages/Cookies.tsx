import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import Breadcrumbs from "@/components/Breadcrumbs";

const Cookies = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Cookie Policy | GOPARTARA"
      description="How GOPARTARA uses cookies and similar technologies. Learn about essential, analytics and preference cookies, and how to manage your choices."
      path="/cookies"
    />
    <Navbar />

    <main className="pt-24 pb-16">
      <div className="container max-w-3xl mx-auto px-4">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Home", href: "/" },
            { label: "Cookie Policy" },
          ]}
        />

        <h1
          className="font-display"
          style={{
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "white",
          }}
        >
          Cookie Policy
        </h1>
        <p className="text-zinc-500 mt-3 text-sm">
          Last updated: April 2026
        </p>

        <div className="prose prose-invert max-w-none mt-10 text-zinc-300 leading-relaxed text-[15px] space-y-6">
          <section>
            <h2 className="text-white font-semibold text-xl mb-3">What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a
              website. They help the site remember your preferences, keep you signed
              in, and understand how visitors use the service so we can make it
              better.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">How we use cookies</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Essential cookies</strong> — required to keep
                you signed in, remember your country and locale, and protect against fraud.
                These cannot be disabled.
              </li>
              <li>
                <strong className="text-white">Preference cookies</strong> — remember your
                saved searches, recently viewed parts, and UI choices like theme.
              </li>
              <li>
                <strong className="text-white">Analytics cookies</strong> — Google Analytics
                helps us understand which pages are popular so we can improve the site.
                You can opt out via our cookie banner.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">Managing your choices</h2>
            <p>
              You can change your cookie preferences at any time using the cookie
              banner at the bottom of the page, or by clearing cookies in your browser
              settings. Disabling preference or analytics cookies may affect some
              features of GOPARTARA.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">Third-party services</h2>
            <p>
              We use trusted third parties such as Google Analytics, Stripe (payments)
              and Supabase (authentication). Each operates under its own privacy and
              cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">Contact</h2>
            <p>
              Questions about cookies or your data? Email{" "}
              <a
                href="mailto:info@gopartara.com"
                className="text-[#cc1111] hover:underline"
              >
                info@gopartara.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>

    <Footer />
    <BackToTop />
  </div>
);

export default Cookies;
