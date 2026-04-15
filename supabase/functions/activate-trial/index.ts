import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { promoCode } = await req.json().catch(() => ({}));

    if (promoCode && promoCode.toUpperCase() !== "COMMUNITY") {
      return new Response(
        JSON.stringify({ error: "Invalid promo code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_period, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    const alreadyHadTrial = profile?.trial_ends_at !== null && profile?.trial_ends_at !== undefined;

    if (alreadyHadTrial && !promoCode) {
      return new Response(
        JSON.stringify({ error: "Trial already used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_plan: "pro",
        subscription_period: "trial",
        trial_ends_at: trialEnd.toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to activate trial" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "1 month Pro activated!",
        trial_ends_at: trialEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
