import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REQUEST-REFUND] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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
      return new Response(JSON.stringify({ error: "Auth failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
    logStep("User authenticated", { userId: user.id, email: user.email });

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Get profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_plan, refund_granted, first_payment_date, display_name")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already refunded
    if (profile.refund_granted) {
      return new Response(JSON.stringify({ error: "Refund already granted", eligible: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan
    const PAID_PLANS = ["pro", "business"];
    if (!PAID_PLANS.includes(profile.subscription_plan)) {
      return new Response(JSON.stringify({ error: "No paid subscription to refund", eligible: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check 7-day window from first payment
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let firstPaymentDate = profile.first_payment_date ? new Date(profile.first_payment_date) : null;
    let stripeCustomerId: string | null = null;

    // Fetch from Stripe if we don't have first_payment_date
    if (!firstPaymentDate && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        // Get first successful charge
        const charges = await stripe.charges.list({
          customer: stripeCustomerId,
          limit: 100,
        });
        const successfulCharges = charges.data
          .filter((c: any) => c.status === "succeeded" && !c.refunded)
          .sort((a: any, b: any) => a.created - b.created);

        if (successfulCharges.length > 0) {
          firstPaymentDate = new Date(successfulCharges[0].created * 1000);
          // Store it
          await adminClient
            .from("profiles")
            .update({ first_payment_date: firstPaymentDate.toISOString() })
            .eq("user_id", user.id);
        }
      }
    } else if (user.email && !stripeCustomerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      }
    }

    if (!firstPaymentDate) {
      return new Response(JSON.stringify({ error: "No payment found", eligible: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysSincePayment = (Date.now() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePayment > 7) {
      return new Response(JSON.stringify({
        error: "Refund window expired",
        eligible: false,
        first_payment_date: firstPaymentDate.toISOString(),
        days_since_payment: Math.floor(daysSincePayment),
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Refund eligible, processing", { daysSincePayment: Math.floor(daysSincePayment) });

    // Downgrade to free immediately
    await adminClient
      .from("profiles")
      .update({
        subscription_plan: "free",
        refund_granted: true,
        refund_date: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Cancel Stripe subscription
    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 10,
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
        logStep("Cancelled subscription", { subId: sub.id });
      }
    }

    // Send confirmation email to user
    const sendEmailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    const sendEmail = async (templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, any>) => {
      await fetch(sendEmailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ templateName, recipientEmail, idempotencyKey, templateData }),
      });
    };

    // Email to user
    await sendEmail(
      "refund-confirmation",
      user.email!,
      `refund-confirm-${user.id}-${Date.now()}`,
      { userName: profile.display_name || user.email }
    );

    // Email to admin
    await sendEmail(
      "refund-admin-notification",
      "info@gopartara.com",
      `refund-admin-${user.id}-${Date.now()}`,
      {
        userName: profile.display_name || "N/A",
        userEmail: user.email,
        plan: profile.subscription_plan,
        stripeCustomerId: stripeCustomerId || "N/A",
      }
    );

    // In-app notification
    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "refund_processed",
      title: "Refund request submitted",
      message: "Your refund request has been received. Your account has been downgraded to Free. Refund will be processed within 5-10 business days.",
      link: "/dashboard",
    });

    logStep("Refund processed successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
