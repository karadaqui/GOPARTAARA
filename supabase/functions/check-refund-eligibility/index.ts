import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ eligible: false, reason: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ eligible: false, reason: "Auth failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_plan, refund_granted, refund_date, first_payment_date")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ eligible: false, reason: "Profile not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.refund_granted) {
      return new Response(JSON.stringify({
        eligible: false,
        reason: "already_refunded",
        refund_date: profile.refund_date,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PAID_PLANS = ["pro", "business"];
    if (!PAID_PLANS.includes(profile.subscription_plan)) {
      return new Response(JSON.stringify({
        eligible: false,
        reason: "no_paid_plan",
        plan: profile.subscription_plan,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find first payment date
    let firstPaymentDate = profile.first_payment_date ? new Date(profile.first_payment_date) : null;

    if (!firstPaymentDate && user.email) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        const charges = await stripe.charges.list({
          customer: customers.data[0].id,
          limit: 100,
        });
        const successful = charges.data
          .filter((c: any) => c.status === "succeeded" && !c.refunded)
          .sort((a: any, b: any) => a.created - b.created);

        if (successful.length > 0) {
          firstPaymentDate = new Date(successful[0].created * 1000);
          await adminClient
            .from("profiles")
            .update({ first_payment_date: firstPaymentDate.toISOString() })
            .eq("user_id", user.id);
        }
      }
    }

    if (!firstPaymentDate) {
      return new Response(JSON.stringify({
        eligible: false,
        reason: "no_payment_found",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysSincePayment = (Date.now() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, Math.ceil(7 - daysSincePayment));

    return new Response(JSON.stringify({
      eligible: daysSincePayment <= 7,
      days_remaining: daysRemaining,
      first_payment_date: firstPaymentDate.toISOString(),
      reason: daysSincePayment > 7 ? "window_expired" : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-REFUND] Error:", msg);
    return new Response(JSON.stringify({ eligible: false, reason: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
