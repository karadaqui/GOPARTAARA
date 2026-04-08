const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const DVLA_API_URL = "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

const BodySchema = z.object({
  registrationNumber: z.string().min(2).max(10).transform(v => v.replace(/\s+/g, '').toUpperCase()),
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
      if (status === 404) {
        return new Response(
          JSON.stringify({ error: "Vehicle not found. Please check the registration number." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("DVLA API error:", status, await dvlaResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to look up vehicle. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
