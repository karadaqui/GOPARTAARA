import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsPreflightResponse, checkRequestSize } from "../_shared/security.ts";

const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_UI08qGZRqV94r2: "pro",
  prod_UIBpaMM0bdRgJ9: "elite",
  prod_UJCdn59OHrLmWH: "elite",
  prod_UJ70agh953wzal: "basic_seller",
  prod_UJ71rmu9dJVO1S: "featured_seller",
  prod_UJ72euxyB9sZcz: "pro_seller",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);
  const sizeCheck = checkRequestSize(req, 16_384);
  if (sizeCheck) return sizeCheck;

  // Plans that should never be overwritten by Stripe sync (manually assigned)
  const PROTECTED_PLANS = ["basic_seller", "featured_seller", "pro_seller", "admin", "elite", "pro"];

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validate JWT via getClaims
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("Auth failed, returning subscribed:false", { message: claimsError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
    if (!user.email) {
      logStep("No email in token, returning subscribed:false");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Service-role client for DB mutations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check current plan — if it's a seller plan, skip Stripe sync entirely
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("subscription_plan, first_payment_date")
      .eq("user_id", user.id)
      .single();

    const currentPlan = profileData?.subscription_plan;
    if (currentPlan && PROTECTED_PLANS.includes(currentPlan)) {
      logStep("User has protected plan, skipping Stripe sync", { currentPlan });
      return new Response(JSON.stringify({ subscribed: true, plan: currentPlan, protected_plan: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer, setting plan to free");
      await adminClient
        .from("profiles")
        .update({ subscription_plan: "free" })
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription, setting plan to free");
      await adminClient
        .from("profiles")
        .update({ subscription_plan: "free" })
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    const plan = PRODUCT_TO_PLAN[productId] || "pro";

    let subscriptionEnd: string | null = null;
    try {
      const endVal = sub.current_period_end;
      if (typeof endVal === "number" && endVal > 0) {
        const ms = endVal < 1e12 ? endVal * 1000 : endVal;
        subscriptionEnd = new Date(ms).toISOString();
      } else if (endVal) {
        subscriptionEnd = new Date(String(endVal)).toISOString();
      }
    } catch {
      logStep("Could not parse subscription end date", { raw: sub.current_period_end });
    }

    // Get billing amount from price
    let billingAmount: number | null = null;
    let billingCurrency = "gbp";
    try {
      const price = sub.items.data[0].price;
      billingAmount = (price as any).unit_amount;
      billingCurrency = (price as any).currency || "gbp";
    } catch {}

    // Get payment method last 4
    let paymentMethodLast4: string | null = null;
    let paymentMethodBrand: string | null = null;
    try {
      const defaultPm = sub.default_payment_method;
      if (defaultPm && typeof defaultPm === "object" && (defaultPm as any).card) {
        paymentMethodLast4 = (defaultPm as any).card.last4;
        paymentMethodBrand = (defaultPm as any).card.brand;
      } else if (typeof defaultPm === "string") {
        const pm = await stripe.paymentMethods.retrieve(defaultPm);
        paymentMethodLast4 = pm.card?.last4 || null;
        paymentMethodBrand = pm.card?.brand || null;
      }
    } catch {}

    logStep("Active subscription found", { productId, plan, subscriptionEnd });

    // Store first_payment_date if not already set
    const updateData: Record<string, any> = { subscription_plan: plan };
    if (!profileData?.first_payment_date) {
      try {
        const startVal = sub.start_date || sub.created;
        if (typeof startVal === "number" && startVal > 0) {
          const ms = startVal < 1e12 ? startVal * 1000 : startVal;
          updateData.first_payment_date = new Date(ms).toISOString();
        }
      } catch {}
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Failed to update profile", { error: updateError.message });
    } else {
      logStep("Profile subscription_plan synced", { plan });

      // Send welcome email if upgrading from free to paid
      if (currentPlan === "free" || !currentPlan) {
        try {
          const nextBillingDate = subscriptionEnd
            ? new Date(subscriptionEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "See dashboard";
          const amountStr = billingAmount ? `£${(billingAmount / 100).toFixed(2)}` : "See dashboard";

          await adminClient.functions.invoke("send-transactional-email", {
            body: {
              templateName: "welcome-purchase",
              to: user.email,
              data: {
                plan_name: plan,
                display_name: user.email?.split("@")[0] || "",
                next_billing_date: nextBillingDate,
                billing_amount: amountStr,
              },
            },
          });
          logStep("Welcome email sent", { email: user.email, plan });
        } catch (emailErr) {
          logStep("Failed to send welcome email", { error: String(emailErr) });
        }
      }
    }

    // Auto-create seller profile if this is a seller plan and none exists yet
    if (["basic_seller", "featured_seller", "pro_seller"].includes(plan)) {
      const { data: existingSeller } = await adminClient
        .from("seller_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingSeller) {
        const sellerTier = plan.replace("_seller", ""); // basic, featured, pro
        const { error: spError } = await adminClient.from("seller_profiles").insert({
          user_id: user.id,
          business_name: user.email?.split("@")[0] || "My Business",
          contact_email: user.email,
          seller_tier: sellerTier,
          approved: true,
        });
        if (spError) {
          logStep("Failed to auto-create seller profile", { error: spError.message });
        } else {
          logStep("Auto-created seller profile", { sellerTier });
        }
      } else {
        // Update existing seller profile to approved + correct tier
        const sellerTier = plan.replace("_seller", "");
        await adminClient.from("seller_profiles")
          .update({ approved: true, seller_tier: sellerTier })
          .eq("user_id", user.id);
        logStep("Updated seller profile to approved", { sellerTier });
      }
    }

    return new Response(JSON.stringify({
      subscribed: true,
      product_id: productId,
      subscription_end: subscriptionEnd,
      billing_amount: billingAmount,
      billing_currency: billingCurrency,
      payment_method_last4: paymentMethodLast4,
      payment_method_brand: paymentMethodBrand,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg, subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
