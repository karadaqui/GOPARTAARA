import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { vin } = await req.json();

    if (!vin || typeof vin !== "string" || vin.length !== 17) {
      return new Response(
        JSON.stringify({ error: "Invalid VIN" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`
    );

    const data = await response.json();
    const results = data.Results;

    const getValue = (variable: string) => {
      const item = results.find((r: any) => r.Variable === variable);
      const val = item?.Value;
      return val && val !== "Not Applicable" && val !== "" && val !== null ? val : null;
    };

    const vehicle = {
      vin: vin.toUpperCase(),
      make: getValue("Make"),
      model: getValue("Model"),
      year: getValue("ModelYear"),
      series: getValue("Series"),
      bodyClass: getValue("BodyClass"),
      engine: getValue("DisplacementL")
        ? parseFloat(getValue("DisplacementL")!).toFixed(1) + "L"
        : getValue("EngineCylinders")
          ? getValue("EngineCylinders") + " cyl"
          : null,
      fuel: getValue("FuelTypePrimary"),
      transmission: getValue("TransmissionStyle"),
      drive: getValue("DriveType"),
      manufacturer: getValue("Manufacturer"),
      country: getValue("PlantCountry"),
      trim: getValue("Trim"),
    };

    if (!vehicle.make) {
      return new Response(
        JSON.stringify({ error: "VIN not found in database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ vehicle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Failed to decode VIN" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
