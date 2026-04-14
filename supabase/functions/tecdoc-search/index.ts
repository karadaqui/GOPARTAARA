import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const BodySchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  year: z.number().int().optional(),
  category: z.string().min(1).max(100),
});

// Common parts per category to generate useful results
const CATEGORY_PARTS: Record<string, Array<{ articleName: string; brandName: string; articleNumber: string }>> = {
  brakes: [
    { articleName: "Front Brake Pads Set", brandName: "Brembo", articleNumber: "P23073" },
    { articleName: "Rear Brake Pads Set", brandName: "Brembo", articleNumber: "P23074" },
    { articleName: "Front Brake Disc", brandName: "Brembo", articleNumber: "09.A457.11" },
    { articleName: "Rear Brake Disc", brandName: "Brembo", articleNumber: "08.A457.11" },
    { articleName: "Brake Caliper Front", brandName: "TRW", articleNumber: "BHN1018" },
  ],
  engine: [
    { articleName: "Timing Belt Kit", brandName: "Gates", articleNumber: "K015571XS" },
    { articleName: "Cam Belt", brandName: "Dayco", articleNumber: "HLP161" },
    { articleName: "Engine Oil Filter", brandName: "Mann", articleNumber: "W712/75" },
    { articleName: "Spark Plugs Set", brandName: "NGK", articleNumber: "BKR6EQUP" },
    { articleName: "Alternator Belt", brandName: "Gates", articleNumber: "6PK1550" },
  ],
  suspension: [
    { articleName: "Front Shock Absorber", brandName: "Monroe", articleNumber: "G8118" },
    { articleName: "Rear Shock Absorber", brandName: "Monroe", articleNumber: "G8120" },
    { articleName: "Front Coil Spring", brandName: "Kayaba", articleNumber: "RA1852" },
    { articleName: "Rear Coil Spring", brandName: "Kayaba", articleNumber: "RA1853" },
    { articleName: "Front Anti Roll Bar Link", brandName: "Meyle", articleNumber: "116 060 0017" },
  ],
  filters: [
    { articleName: "Air Filter", brandName: "Mann", articleNumber: "C26168" },
    { articleName: "Oil Filter", brandName: "Mann", articleNumber: "W712/75" },
    { articleName: "Cabin Filter / Pollen Filter", brandName: "Mann", articleNumber: "CU2939" },
    { articleName: "Fuel Filter", brandName: "Bosch", articleNumber: "F026402062" },
  ],
  exhaust: [
    { articleName: "Front Exhaust Pipe", brandName: "Bosal", articleNumber: "953-060" },
    { articleName: "Centre Exhaust Silencer", brandName: "Bosal", articleNumber: "233-961" },
    { articleName: "Rear Exhaust Silencer", brandName: "Bosal", articleNumber: "233-962" },
    { articleName: "Exhaust Gasket", brandName: "Elring", articleNumber: "007.461" },
  ],
  electrics: [
    { articleName: "Car Battery 60Ah", brandName: "Bosch", articleNumber: "S4005" },
    { articleName: "Starter Motor", brandName: "Valeo", articleNumber: "246036" },
    { articleName: "Alternator", brandName: "Valeo", articleNumber: "FGN20C009" },
    { articleName: "Lambda Oxygen Sensor", brandName: "Bosch", articleNumber: "0258006028" },
  ],
  cooling: [
    { articleName: "Radiator", brandName: "Nissens", articleNumber: "636016" },
    { articleName: "Water Pump", brandName: "Gates", articleNumber: "WP0016" },
    { articleName: "Thermostat", brandName: "Wahler", articleNumber: "4101.82D" },
    { articleName: "Coolant Temperature Sensor", brandName: "Bosch", articleNumber: "0280130026" },
  ],
  steering: [
    { articleName: "Power Steering Rack", brandName: "TRW", articleNumber: "JRP0245" },
    { articleName: "Steering Track Rod End", brandName: "TRW", articleNumber: "JTE1142" },
    { articleName: "Power Steering Pump", brandName: "TRW", articleNumber: "JPR285" },
    { articleName: "Steering Column", brandName: "TRW", articleNumber: "JCO166" },
  ],
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_TECDOC_KEY");

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400, corsHeaders);
    }

    const { make, model, year, category } = parsed.data;

    // Try TecDoc API first if key exists
    if (RAPIDAPI_KEY) {
      try {
        // Use suppliers list to verify key works, then search
        const searchQuery = encodeURIComponent(`${category} ${make}`);
        const url = `https://${RAPIDAPI_HOST}/articles/search/lang-id/4/article-search/${searchQuery}`;
        console.log(`[tecdoc-search] Trying TecDoc: ${url}`);

        const res = await fetch(url, {
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.articles || data?.items || [];
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items.slice(0, 30).map((item: any) => ({
              articleName: item.articleName || item.name || item.description || "Auto Part",
              brandName: item.brandName || item.supplierName || "",
              articleNumber: item.articleNumber || item.articleNo || "",
            }));
            console.log(`[tecdoc-search] TecDoc returned ${mapped.length} articles`);
            return jsonResponse({ articles: mapped, source: "tecdoc" }, 200, corsHeaders);
          }
        }
        const text = await res.text();
        console.log(`[tecdoc-search] TecDoc ${res.status}, falling back to catalog`);
      } catch (e) {
        console.error(`[tecdoc-search] TecDoc API error, using fallback:`, e);
      }
    }

    // Fallback: return curated parts catalog for the category
    const parts = CATEGORY_PARTS[category] || [];
    console.log(`[tecdoc-search] Returning ${parts.length} catalog parts for "${category}"`);
    return jsonResponse({ articles: parts, source: "catalog" }, 200, corsHeaders);
  } catch (error) {
    console.error("[tecdoc-search] Error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", articles: [], fallback: true }, 200, corsHeaders);
  }
});
