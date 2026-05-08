// Commission rate helpers for marketplace sales.
// Tiered by seller's subscription plan.

export type CommissionPlan = "free" | "pro" | "elite" | "admin" | string | null | undefined;

export const getCommissionRate = (plan: CommissionPlan): number => {
  const p = (plan || "free").toLowerCase();
  if (p === "elite" || p === "admin") return 0.03;
  if (p === "pro") return 0.04;
  return 0.05;
};

export const getCommissionPercent = (plan: CommissionPlan): number =>
  Math.round(getCommissionRate(plan) * 100);

export const getSellerReceivePercent = (plan: CommissionPlan): number =>
  100 - getCommissionPercent(plan);

export const calculatePayout = (amount: number, plan: CommissionPlan): number =>
  amount * (1 - getCommissionRate(plan));

export const getCommissionBlurb = (plan: CommissionPlan): string => {
  const p = (plan || "free").toLowerCase();
  if (p === "elite" || p === "admin")
    return "GOPARTARA charges a 3% platform fee as an Elite member.";
  if (p === "pro")
    return "GOPARTARA charges a 4% platform fee as a Pro member.";
  return "GOPARTARA charges a 5% platform fee. Upgrade to Pro or Elite to reduce your fee.";
};
