const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VEHICLE_NAME_MAPPINGS: Record<string, string[]> = {
  'jazz': ['fit', 'jazz'], 'fit': ['fit', 'jazz'],
  'hr-v': ['hr-v', 'vezel'], 'cr-v': ['cr-v'], 'civic': ['civic'], 'accord': ['accord'],
  'astra': ['astra'], 'corsa': ['corsa', 'adam', 'agila'],
  'insignia': ['insignia', 'buick regal', 'holden insignia'],
  'mokka': ['mokka', 'buick encore', 'chevrolet trax'],
  'zafira': ['zafira'], 'vectra': ['vectra', 'chevrolet epica'],
  'meriva': ['meriva'], 'antara': ['antara', 'chevrolet captiva'],
  'mondeo': ['mondeo', 'fusion'], 'fiesta': ['fiesta'], 'focus': ['focus'],
  'puma': ['puma'], 'kuga': ['kuga', 'escape'], 'galaxy': ['galaxy', 's-max'], 'transit': ['transit'],
  'golf': ['golf', 'rabbit', 'caribe'], 'polo': ['polo'], 'passat': ['passat'],
  'tiguan': ['tiguan'], 'touareg': ['touareg'], 'caddy': ['caddy', 'saveiro'],
  'up': ['up', 'mii', 'citigo'],
  'yaris': ['yaris', 'vitz', 'echo'], 'auris': ['auris', 'corolla'],
  'avensis': ['avensis'], 'corolla': ['corolla', 'auris'],
  'hilux': ['hilux', 'tacoma'], 'land cruiser': ['land cruiser'],
  'rav4': ['rav4'], 'prius': ['prius'], 'bz4x': ['bz4x'],
  'aygo': ['aygo', 'c1', '107'],
  'micra': ['micra', 'march'], 'qashqai': ['qashqai', 'rogue sport', 'dualis'],
  'juke': ['juke'], 'x-trail': ['x-trail', 'rogue'],
  'navara': ['navara', 'frontier', 'd40'], 'note': ['note'], 'leaf': ['leaf'],
  '1 series': ['1 series', '128i', '135i'],
  '3 series': ['3 series', '320i', '328i', '330i'],
  '5 series': ['5 series', '520i', '528i', '530i'],
  '7 series': ['7 series', '740i', '750i'],
  'x1': ['x1'], 'x3': ['x3'], 'x5': ['x5'],
  'a-class': ['a-class', 'a180', 'a200'], 'c-class': ['c-class', 'c200', 'c220'],
  'e-class': ['e-class', 'e200', 'e220'], 's-class': ['s-class'],
  'glc': ['glc'], 'gle': ['gle', 'ml'],
  'clio': ['clio', 'lutecia'], 'megane': ['megane', 'fluence'],
  'laguna': ['laguna'], 'scenic': ['scenic'], 'kadjar': ['kadjar'],
  'captur': ['captur'], 'zoe': ['zoe'],
  '207': ['207'], '208': ['208'], '308': ['308'], '508': ['508'],
  '2008': ['2008'], '3008': ['3008'], '5008': ['5008'],
  'c3': ['c3', 'aircross'], 'c4': ['c4'], 'c5': ['c5'],
  'berlingo': ['berlingo', 'partner'],
  '500': ['500'], 'punto': ['punto', 'grand punto'], 'bravo': ['bravo'],
  'tipo': ['tipo', 'egea'], 'panda': ['panda'],
  'i10': ['i10'], 'i20': ['i20'], 'i30': ['i30'], 'i40': ['i40'],
  'tucson': ['tucson', 'ix35'], 'santa fe': ['santa fe'], 'ioniq': ['ioniq'],
  'picanto': ['picanto', 'morning'], 'rio': ['rio', 'pride'],
  'ceed': ['ceed'], 'sportage': ['sportage'], 'sorento': ['sorento'],
  'stinger': ['stinger'], 'ev6': ['ev6'],
  'fabia': ['fabia'], 'octavia': ['octavia'], 'superb': ['superb'],
  'karoq': ['karoq'], 'kodiaq': ['kodiaq'], 'scala': ['scala'],
  'ibiza': ['ibiza'], 'leon': ['leon'], 'arona': ['arona'],
  'ateca': ['ateca'], 'tarraco': ['tarraco'],
  'a1': ['a1'], 'a3': ['a3'], 'a4': ['a4'], 'a5': ['a5'],
  'a6': ['a6'], 'a7': ['a7'], 'a8': ['a8'],
  'q3': ['q3'], 'q5': ['q5'], 'q7': ['q7'], 'tt': ['tt'], 'r8': ['r8'],
  'mazda2': ['mazda2', 'demio'], 'mazda3': ['mazda3', 'axela'],
  'mazda6': ['mazda6', 'atenza'], 'cx-3': ['cx-3'], 'cx-5': ['cx-5'],
  'cx-30': ['cx-30'], 'mx-5': ['mx-5', 'miata', 'roadster'],
  'colt': ['colt'], 'asx': ['asx', 'outlander sport', 'rvr'],
  'outlander': ['outlander'], 'l200': ['l200', 'triton', 'strada'],
  'eclipse cross': ['eclipse cross'],
  'impreza': ['impreza'], 'legacy': ['legacy'], 'outback': ['outback'],
  'forester': ['forester'], 'xv': ['xv', 'crosstrek'],
  'v40': ['v40'], 'v60': ['v60'], 'v90': ['v90'],
  'xc40': ['xc40'], 'xc60': ['xc60'], 'xc90': ['xc90'],
  'discovery': ['discovery'], 'discovery sport': ['discovery sport'],
  'defender': ['defender'], 'range rover': ['range rover'],
  'range rover sport': ['range rover sport'],
  'range rover evoque': ['range rover evoque'],
  'range rover velar': ['range rover velar'],
  'freelander': ['freelander', 'lr2'],
  'xe': ['xe'], 'xf': ['xf'], 'xj': ['xj'],
  'e-pace': ['e-pace'], 'f-pace': ['f-pace'], 'i-pace': ['i-pace'],
};

const MAKE_MAPPINGS: Record<string, string[]> = {
  'vauxhall': ['vauxhall', 'opel', 'holden', 'chevrolet'],
  'opel': ['opel', 'vauxhall', 'holden', 'chevrolet'],
  'holden': ['holden', 'vauxhall', 'opel', 'chevrolet'],
  'dacia': ['dacia', 'renault'],
  'seat': ['seat', 'cupra'],
  'cupra': ['cupra', 'seat'],
  'genesis': ['genesis', 'hyundai'],
  'lexus': ['lexus', 'toyota'],
  'infiniti': ['infiniti', 'nissan'],
  'acura': ['acura', 'honda'],
};

function getMakeAlternatives(make: string): string[] {
  return MAKE_MAPPINGS[make.toLowerCase()] || [make.toLowerCase()];
}

function getModelAlternatives(model: string): string[] {
  return VEHICLE_NAME_MAPPINGS[model.toLowerCase()] || [model.toLowerCase()];
}

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

    const makeAlts = getMakeAlternatives(make);
    const modelAlts = getModelAlternatives(model);

    // Try all make/model combinations for fuel economy (richest data)
    let fuelResult: Record<string, unknown> | null = null;
    for (const mk of makeAlts) {
      for (const md of modelAlts) {
        fuelResult = await fetchFuelEconomy(mk, md, year);
        if (fuelResult) break;
      }
      if (fuelResult) break;
    }

    // Try NHTSA with alternatives too
    let nhtsaResult: Record<string, unknown> | null = null;
    for (const mk of makeAlts) {
      for (const md of modelAlts) {
        nhtsaResult = await fetchNHTSA(mk, md, year);
        if (nhtsaResult) break;
      }
      if (nhtsaResult) break;
    }

    const specs: Record<string, unknown> = {};
    if (nhtsaResult) Object.assign(specs, nhtsaResult);
    if (fuelResult) Object.assign(specs, fuelResult);

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

    const results = data?.Results || [];
    const match = results.find(
      (r: { Model_Name: string }) =>
        r.Model_Name?.toLowerCase() === model.toLowerCase()
    );

    if (!match) return null;

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
    const menuUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${year}`;
    const menuRes = await fetch(menuUrl, { headers: { Accept: "application/json" } });
    if (!menuRes.ok) { await menuRes.text(); return null; }
    const menuData = await menuRes.json();

    const menuItems = menuData?.menuItem;
    const items = Array.isArray(menuItems) ? menuItems : menuItems ? [menuItems] : [];
    const makeMatch = items.find(
      (item: { text: string }) =>
        item.text?.toLowerCase() === make.toLowerCase()
    );
    if (!makeMatch) return null;

    const modelUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${encodeURIComponent(makeMatch.text)}`;
    const modelRes = await fetch(modelUrl, { headers: { Accept: "application/json" } });
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

    const optUrl = `https://fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(makeMatch.text)}&model=${encodeURIComponent(modelMatch.text)}`;
    const optRes = await fetch(optUrl, { headers: { Accept: "application/json" } });
    if (!optRes.ok) { await optRes.text(); return null; }
    const optData = await optRes.json();

    const optItems = optData?.menuItem;
    const options = Array.isArray(optItems) ? optItems : optItems ? [optItems] : [];
    if (options.length === 0) return null;

    const vehicleId = options[0].value;
    const vehUrl = `https://fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
    const vehRes = await fetch(vehUrl, { headers: { Accept: "application/json" } });
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
      startStop: veh.startStop === "Y",
      turbocharger: veh.tCharger === "T",
      supercharger: veh.sCharger === "S",
    };
  } catch (e) {
    console.error("FuelEconomy fetch error:", e);
    return null;
  }
}
