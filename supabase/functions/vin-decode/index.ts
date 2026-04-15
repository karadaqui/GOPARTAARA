const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const getValue = (...variables: string[]): string | null => {
      for (const variable of variables) {
        const item = results.find((r: any) => r.Variable === variable);
        const val = item?.Value;
        if (val && val !== "Not Applicable" && val !== "" && val !== "null") {
          return val;
        }
      }
      return null;
    };

    const displacementL = getValue("Displacement (L)", "DisplacementL");
    const displacementCC = getValue("Displacement (CC)", "DisplacementCC");
    const cylinders = getValue("Engine Number of Cylinders", "EngineCylinders");

    const engine = displacementL
      ? parseFloat(displacementL).toFixed(1) + "L"
      : displacementCC
        ? (parseFloat(displacementCC) / 1000).toFixed(1) + "L"
        : cylinders
          ? cylinders + " cyl"
          : null;

    const vehicle = {
      vin: vin.toUpperCase(),
      make: getValue("Make"),
      model: getValue("Model"),
      year: getValue("Model Year", "ModelYear"),
      series: getValue("Series", "Series2"),
      trim: getValue("Trim", "Trim2"),
      bodyClass: getValue("Body Class", "BodyClass"),
      engine,
      fuel: getValue("Fuel Type - Primary", "FuelTypePrimary"),
      transmission: getValue("Transmission Style", "TransmissionStyle"),
      drive: getValue("Drive Type", "DriveType"),
      manufacturer: getValue("Manufacturer Name", "Manufacturer"),
      country: getValue("Plant Country", "PlantCountry"),
      doors: getValue("Doors", "NumberOfDoors"),
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
