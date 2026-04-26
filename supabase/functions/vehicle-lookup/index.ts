const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const DVLA_API_URL = "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

const FREE_LIMIT = 10;
const UNLIMITED_PLANS = ["pro", "elite", "admin"];

const BodySchema = z.object({
  registrationNumber: z.string().min(2).max(10)
    .regex(/^[A-Za-z0-9]+$/, "Registration number must contain only letters and numbers")
    .transform(v => v.replace(/\s+/g, '').toUpperCase()),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DVLA_API_KEY = Deno.env.get("DVLA_API_KEY");
    if (!DVLA_API_KEY) {
      return new Response(
        JSON.stringify({ error: "DVLA API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid registration number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { registrationNumber } = parsed.data;

    // ── Server-side enforced search limit ──
    // Reg lookups count toward the monthly free-search budget for authenticated users.
    // Anonymous users are NOT limited server-side (per spec).
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
      const userId = claimsData?.claims?.sub as string | undefined;

      if (userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("subscription_plan, bonus_searches")
          .eq("user_id", userId)
          .single();

        const plan = profile?.subscription_plan || "free";
        const bonusSearches = profile?.bonus_searches || 0;
        const isUnlimited = UNLIMITED_PLANS.includes(plan);

        if (!isUnlimited) {
          const now = new Date();
          const monthYear = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
          const totalAllowed = FREE_LIMIT + bonusSearches;

          const { data: usageRow } = await supabaseAdmin
            .from("search_usage")
            .select("search_count")
            .eq("user_id", userId)
            .eq("month_year", monthYear)
            .maybeSingle();

          const currentCount = usageRow?.search_count || 0;

          if (currentCount >= totalAllowed) {
            const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
            return new Response(
              JSON.stringify({
                error: "SEARCH_LIMIT_REACHED",
                message: `You've used all ${totalAllowed} free searches this month. Upgrade to Pro for unlimited searches.`,
                upgradeUrl: "/pricing",
                remaining: 0,
                searchCount: currentCount,
                totalAllowed,
                resetsAt: nextMonth.toISOString(),
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          await supabaseAdmin
            .from("search_usage")
            .upsert(
              { user_id: userId, month_year: monthYear, search_count: currentCount + 1, updated_at: new Date().toISOString() },
              { onConflict: "user_id,month_year" }
            );
        }
      }
    }

    const dvlaResponse = await fetch(DVLA_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": DVLA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationNumber }),
    });

    if (!dvlaResponse.ok) {
      const status = dvlaResponse.status;
      let errorDetail = "Failed to look up vehicle. Please try again.";
      try {
        const errBody = await dvlaResponse.json();
        const detail = errBody?.errors?.[0]?.detail;
        if (detail) errorDetail = detail;
      } catch {
        errorDetail = await dvlaResponse.text().catch(() => errorDetail);
      }
      
      if (status === 404) {
        return new Response(
          JSON.stringify({ error: "Vehicle not found. Please check the registration number." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 400) {
        return new Response(
          JSON.stringify({ error: `Invalid registration number format. ${errorDetail}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("DVLA API error:", status, errorDetail);
      return new Response(
        JSON.stringify({ error: errorDetail }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await dvlaResponse.json();

    const vehicle = {
      registrationNumber: data.registrationNumber || registrationNumber,
      make: data.make || "Unknown",
      colour: data.colour || null,
      fuelType: data.fuelType || null,
      yearOfManufacture: data.yearOfManufacture || null,
      engineCapacity: data.engineCapacity || null,
      motStatus: data.motStatus || null,
      taxStatus: data.taxStatus || null,
    };

    return new Response(
      JSON.stringify({ vehicle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vehicle lookup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
