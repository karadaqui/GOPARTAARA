import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_PROMO_CODES = ["COMMUNITY"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    let promoCode: string | null = null;

    try {
      const body = await req.json();
      promoCode = body?.promoCode?.toUpperCase?.() || null;
    } catch {
      // no body is fine
    }

    // Get existing profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_period, trial_ends_at, promo_code_used")
      .eq("user_id", user.id)
      .single();

    // Check if promo code already used
    if (promoCode && profile?.promo_code_used) {
      return new Response(
        JSON.stringify({
          already_used: true,
          message: "You already used a promo code — your Pro trial is active!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if trial already used (no promo code path)
    if (!promoCode && profile?.trial_ends_at) {
      return new Response(
        JSON.stringify({
          already_used: true,
          message: "You already have an active Pro trial!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate promo code if provided
    if (promoCode && !VALID_PROMO_CODES.includes(promoCode)) {
      return new Response(
        JSON.stringify({ error: "Invalid promo code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't downgrade paying users
    if (
      profile?.subscription_plan &&
      profile.subscription_plan !== "free" &&
      profile.subscription_period !== "trial"
    ) {
      return new Response(
        JSON.stringify({
          already_used: true,
          message: "You already have an active paid subscription!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Activate trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_plan: "pro",
        subscription_period: "trial",
        trial_ends_at: trialEnd.toISOString(),
        promo_code_used: promoCode || null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[activate-trial] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to activate trial" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "🎉 1 month Pro activated!",
        trial_ends_at: trialEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[activate-trial] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
