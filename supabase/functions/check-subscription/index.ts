import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_UI08qGZRqV94r2: "pro",
  prod_UIBpaMM0bdRgJ9: "business",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SELLER_PLANS = ["basic_seller", "featured_seller", "pro_seller", "admin"];

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // User-context client to get the authenticated user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user?.email) {
      logStep("Auth failed, returning subscribed:false", { message: userError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
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
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single();

    const currentPlan = profileData?.subscription_plan;
    if (currentPlan && SELLER_PLANS.includes(currentPlan)) {
      logStep("User has seller plan, skipping Stripe sync", { currentPlan });
      return new Response(JSON.stringify({ subscribed: true, plan: currentPlan, seller_plan: true }), {
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
    logStep("Active subscription found", { productId, plan, subscriptionEnd });

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ subscription_plan: plan })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Failed to update profile", { error: updateError.message });
    } else {
      logStep("Profile subscription_plan synced", { plan });
    }

    return new Response(JSON.stringify({
      subscribed: true,
      product_id: productId,
      subscription_end: subscriptionEnd,
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
