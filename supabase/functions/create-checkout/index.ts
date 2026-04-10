import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) throw new Error("User not authenticated");

    // Rate limit
    const { allowed } = await checkRateLimit(authHeader.slice(-20), "create-checkout");
    if (!allowed) return rateLimitResponse(corsHeaders);

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    const { priceId, mode } = await req.json();
    if (!priceId) throw new Error("Missing priceId");

    const checkoutMode = mode === "payment" ? "payment" : "subscription";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: checkoutMode,
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/#pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    const isAuthError = error instanceof Error && 
      (error.message.includes("not authenticated") || error.message.includes("Missing priceId"));
    return new Response(
      JSON.stringify({ error: isAuthError ? error.message : "An error occurred processing your request." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: isAuthError ? 401 : 500 }
    );
  }
});
