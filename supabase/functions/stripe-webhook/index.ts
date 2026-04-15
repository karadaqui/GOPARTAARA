import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback: parse without verification (dev only)
      event = JSON.parse(body) as Stripe.Event;
      console.warn("[STRIPE-WEBHOOK] No webhook secret configured — skipping signature verification");
    }
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      // Handle boost payments
      if (metadata.type === "boost" && metadata.listing_id) {
        const durationDays = parseInt(metadata.duration_days || "7", 10);
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + durationDays);

        console.log(`[STRIPE-WEBHOOK] Activating boost for listing ${metadata.listing_id}, duration: ${durationDays} days`);

        const { error } = await adminClient
          .from("seller_listings")
          .update({
            featured: true,
            featured_until: featuredUntil.toISOString(),
            boost_package: metadata.package_name || null,
          })
          .eq("id", metadata.listing_id);

        if (error) {
          console.error("[STRIPE-WEBHOOK] Failed to update listing:", error);
        } else {
          console.log(`[STRIPE-WEBHOOK] Listing ${metadata.listing_id} boosted until ${featuredUntil.toISOString()}`);
        }
      }

      // Handle subscription payments (existing flow)
      if (metadata.type === "subscription" && metadata.user_id) {
        console.log(`[STRIPE-WEBHOOK] Subscription payment for user ${metadata.user_id}`);
        // Subscription handling is done by check-subscription edge function
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
