import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Get started with basic searches",
    features: ["5 searches per month", "Basic price comparison", "UK suppliers only", "Email support"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "£9.99",
    period: "/month",
    description: "For enthusiasts and DIY mechanics",
    features: [
      "Unlimited searches",
      "Full price comparison",
      "UK + global suppliers",
      "Photo search",
      "Price alerts",
      "Priority support",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "£24.99",
    period: "/month",
    description: "For garages and trade professionals",
    features: [
      "Unlimited searches",
      "Full price comparison",
      "UK + global suppliers",
      "Photo search",
      "Bulk ordering",
      "API access",
      "Priority support",
      "Dedicated account manager",
    ],
    cta: "Start Business",
    popular: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-24">
    <div className="container px-4">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, Transparent <span className="text-gradient">Pricing</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Choose the plan that fits your needs. Upgrade or cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-8 flex flex-col ${
              plan.popular ? "glass glow-red border-primary/50 relative" : "glass"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full bg-primary text-primary-foreground">
                Most Popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
            <div className="mb-6">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-secondary-foreground">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.popular ? "default" : "outline"} className="w-full rounded-xl">
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
