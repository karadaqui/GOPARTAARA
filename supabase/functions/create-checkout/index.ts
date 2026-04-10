import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT, logSecurityEvent, checkRequestSize } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  // Request size limit (16KB)
  const sizeCheck = checkRequestSize(req, 16_384);
  if (sizeCheck) return sizeCheck;

  // Rate limit (5/min for checkout)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(clientIp, "create-checkout");
  if (!allowed) {
    await logSecurityEvent("rate_limit_exceeded", req, undefined, "create-checkout");
    return rateLimitResponse(corsHeaders);
  }

  // JWT validation (mandatory)
  const auth = await validateJWT(req, corsHeaders);
  if (auth.error) {
    await logSecurityEvent("unauthenticated_access", req, undefined, "create-checkout");
    return auth.error;
  }

  if (!auth.email) {
    return jsonResponse({ error: "Email required for checkout." }, 400, corsHeaders);
  }

  try {
    const { priceId, mode } = await req.json();
    if (!priceId) {
      return jsonResponse({ error: "Missing priceId" }, 400, corsHeaders);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Look up existing Stripe customer
    const customers = await stripe.customers.list({ email: auth.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const checkoutMode = mode === "payment" ? "payment" : "subscription";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : auth.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: checkoutMode,
      success_url: `https://gopartara.com/dashboard?checkout=success`,
      cancel_url: `https://gopartara.com/pricing`,
    });

    return jsonResponse({ url: session.url }, 200, corsHeaders);
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    return jsonResponse({ error: "An error occurred processing your request." }, 500, corsHeaders);
  }
});
