import { Check, Crown, Star, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sellerPlans = [
  {
    name: "Basic Seller",
    price: "£9.99",
    period: "/month",
    icon: Store,
    description: "Get listed in the GOPARTARA supplier directory",
    features: [
      "Supplier directory listing",
      "Business profile page",
      "Customer enquiries",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Featured Seller",
    price: "£24.99",
    period: "/month",
    icon: Star,
    description: "Stand out with highlighted listings and badges",
    features: [
      "Everything in Basic",
      "Highlighted listing",
      "Featured badge",
      "Priority placement",
      "Analytics dashboard",
    ],
    cta: "Go Featured",
    popular: true,
  },
  {
    name: "Pro Seller",
    price: "£49.99",
    period: "/month",
    icon: Crown,
    description: "Maximum visibility and premium features",
    features: [
      "Everything in Featured",
      "Top placement",
      "Premium profile page",
      "Dedicated seller section",
      "Priority support",
      "API access",
    ],
    cta: "Go Pro",
    popular: false,
  },
];

const SellerPricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="seller-pricing" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            For Parts <span className="text-gradient">Sellers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            List your parts on GOPARTARA and reach thousands of buyers. Choose the
            tier that fits your business.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {sellerPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.popular
                    ? "glass glow-red border-primary/50 relative"
                    : "glass"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={20} className="text-primary" />
                  <h3 className="font-display text-xl font-bold">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-secondary-foreground"
                    >
                      <Check
                        size={16}
                        className="text-primary shrink-0 mt-0.5"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full rounded-xl"
                  onClick={() => navigate("/list-your-parts")}
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SellerPricingSection;
