const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { make, model, year } = await req.json();

    if (!make || !model || !year) {
      return new Response(JSON.stringify({ error: "make, model, year required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch NHTSA and FuelEconomy data in parallel
    const [nhtsaData, fuelData] = await Promise.allSettled([
      fetchNHTSA(make, model, year),
      fetchFuelEconomy(make, model, year),
    ]);

    const specs: Record<string, unknown> = {};

    if (nhtsaData.status === "fulfilled" && nhtsaData.value) {
      Object.assign(specs, nhtsaData.value);
    }

    if (fuelData.status === "fulfilled" && fuelData.value) {
      Object.assign(specs, fuelData.value);
    }

    return new Response(JSON.stringify({ specs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("vehicle-specs error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchNHTSA(make: string, model: string, year: number) {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
    const res = await fetch(url);
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();

    // Also try to get vehicle variables for more detail
    const detailUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`;
    const detailRes = await fetch(detailUrl);
    const detailBody = detailRes.ok ? await detailRes.json() : null;
    if (!detailRes.ok) await detailRes.text().catch(() => {});

    // Find matching model in results
    const results = data?.Results || [];
    const match = results.find(
      (r: { Model_Name: string }) =>
        r.Model_Name?.toLowerCase() === model.toLowerCase()
    );

    return {
      nhtsaVehicleType: match?.VehicleTypeName || null,
      nhtsaMakeId: match?.Make_ID || null,
      nhtsaModelId: match?.Model_ID || null,
    };
  } catch (e) {
    console.error("NHTSA fetch error:", e);
    return null;
  }
}

async function fetchFuelEconomy(make: string, model: string, year: number) {
  try {
    // Step 1: Get menu items for the year
    const menuUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${year}`;
    const menuRes = await fetch(menuUrl, {
      headers: { Accept: "application/json" },
    });
    if (!menuRes.ok) { await menuRes.text(); return null; }
    const menuData = await menuRes.json();

    // Find the make in the menu
    const menuItems = menuData?.menuItem;
    const items = Array.isArray(menuItems) ? menuItems : menuItems ? [menuItems] : [];
    const makeMatch = items.find(
      (item: { text: string }) =>
        item.text?.toLowerCase() === make.toLowerCase()
    );

    if (!makeMatch) return null;

    // Step 2: Get models for this make
    const modelUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${encodeURIComponent(makeMatch.text)}`;
    const modelRes = await fetch(modelUrl, {
      headers: { Accept: "application/json" },
    });
    if (!modelRes.ok) { await modelRes.text(); return null; }
    const modelData = await modelRes.json();

    const modelItems = modelData?.menuItem;
    const models = Array.isArray(modelItems) ? modelItems : modelItems ? [modelItems] : [];
    const modelMatch = models.find(
      (item: { text: string }) =>
        item.text?.toLowerCase().includes(model.toLowerCase()) ||
        model.toLowerCase().includes(item.text?.toLowerCase())
    );

    if (!modelMatch) return null;

    // Step 3: Get options for this model
    const optUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(makeMatch.text)}&model=${encodeURIComponent(modelMatch.text)}`;
    const optRes = await fetch(optUrl, {
      headers: { Accept: "application/json" },
    });
    if (!optRes.ok) { await optRes.text(); return null; }
    const optData = await optRes.json();

    const optItems = optData?.menuItem;
    const options = Array.isArray(optItems) ? optItems : optItems ? [optItems] : [];

    if (options.length === 0) return null;

    // Step 4: Get vehicle details for the first option
    const vehicleId = options[0].value;
    const vehUrl = `https://fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
    const vehRes = await fetch(vehUrl, {
      headers: { Accept: "application/json" },
    });
    if (!vehRes.ok) { await vehRes.text(); return null; }
    const veh = await vehRes.json();

    return {
      fuelType: veh.fuelType || veh.atvType || null,
      cylinders: veh.cylinders ? parseInt(veh.cylinders) : null,
      displacement: veh.displ ? parseFloat(veh.displ) : null,
      transmission: veh.trany || null,
      drive: veh.drive || null,
      vehicleClass: veh.VClass || null,
      cityMpg: veh.city08 ? parseInt(veh.city08) : null,
      highwayMpg: veh.highway08 ? parseInt(veh.highway08) : null,
      combinedMpg: veh.comb08 ? parseInt(veh.comb08) : null,
      co2: veh.co2TailpipeGpm ? parseFloat(veh.co2TailpipeGpm) : null,
      fuelCostAnnual: veh.fuelCost08 ? parseInt(veh.fuelCost08) : null,
      startStop: veh.startStop === "Y",
      turbocharger: veh.tCharger === "T",
      supercharger: veh.sCharger === "S",
    };
  } catch (e) {
    console.error("FuelEconomy fetch error:", e);
    return null;
  }
}
