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
    { articleName: "Front Brake Pads Set", brandName: "Brembo", articleNumber: "P 24 076" },
    { articleName: "Front Brake Disc (Pair)", brandName: "Bosch", articleNumber: "0 986 479 100" },
    { articleName: "Rear Brake Pads Set", brandName: "TRW", articleNumber: "GDB1763" },
    { articleName: "Rear Brake Disc", brandName: "ATE", articleNumber: "24.0112-0210.1" },
    { articleName: "Brake Caliper Front Right", brandName: "Brembo", articleNumber: "F 68 157" },
    { articleName: "Brake Hose Front", brandName: "Febi Bilstein", articleNumber: "36058" },
  ],
  engine: [
    { articleName: "Oil Filter", brandName: "MANN-FILTER", articleNumber: "HU 7008 z" },
    { articleName: "Spark Plug Set (4x)", brandName: "NGK", articleNumber: "BKUR6ET-10" },
    { articleName: "Timing Belt Kit", brandName: "Gates", articleNumber: "K015603XS" },
    { articleName: "Engine Mount Right", brandName: "Lemförder", articleNumber: "37714 01" },
    { articleName: "Crankshaft Sensor", brandName: "Bosch", articleNumber: "0 261 210 302" },
    { articleName: "Valve Cover Gasket", brandName: "Elring", articleNumber: "389.702" },
  ],
  suspension: [
    { articleName: "Front Shock Absorber", brandName: "Monroe", articleNumber: "G8802" },
    { articleName: "Rear Coil Spring", brandName: "Sachs", articleNumber: "997 903" },
    { articleName: "Front Control Arm Lower", brandName: "Meyle", articleNumber: "616 050 0018" },
    { articleName: "Anti-Roll Bar Link Front", brandName: "TRW", articleNumber: "JTS491" },
    { articleName: "Top Strut Mount Front", brandName: "SKF", articleNumber: "VKDA 35601 T" },
    { articleName: "Front Wheel Bearing Kit", brandName: "FAG", articleNumber: "713 6440 30" },
  ],
  filters: [
    { articleName: "Air Filter", brandName: "MANN-FILTER", articleNumber: "C 30 005" },
    { articleName: "Oil Filter", brandName: "Bosch", articleNumber: "F 026 407 209" },
    { articleName: "Fuel Filter", brandName: "MANN-FILTER", articleNumber: "WK 820/18" },
    { articleName: "Cabin Pollen Filter", brandName: "MANN-FILTER", articleNumber: "CUK 2939" },
    { articleName: "Cabin Filter Activated Carbon", brandName: "Bosch", articleNumber: "1 987 435 543" },
  ],
  exhaust: [
    { articleName: "Catalytic Converter", brandName: "Walker", articleNumber: "20668" },
    { articleName: "Exhaust Front Pipe", brandName: "Bosal", articleNumber: "750-181" },
    { articleName: "Rear Silencer", brandName: "Bosal", articleNumber: "185-459" },
    { articleName: "Exhaust Mounting Rubber", brandName: "Febi Bilstein", articleNumber: "10044" },
    { articleName: "Lambda Sensor Pre-Cat", brandName: "Bosch", articleNumber: "0 258 010 065" },
  ],
  electrics: [
    { articleName: "Alternator 120A", brandName: "Valeo", articleNumber: "439674" },
    { articleName: "Starter Motor", brandName: "Bosch", articleNumber: "0 001 138 017" },
    { articleName: "Ignition Coil", brandName: "Beru", articleNumber: "ZSE003" },
    { articleName: "Battery 60Ah", brandName: "Varta", articleNumber: "D24" },
    { articleName: "Glow Plug (Diesel)", brandName: "NGK", articleNumber: "Y-8003J" },
    { articleName: "ABS Sensor Front", brandName: "Bosch", articleNumber: "0 265 008 089" },
  ],
  cooling: [
    { articleName: "Radiator", brandName: "Nissens", articleNumber: "630731" },
    { articleName: "Water Pump", brandName: "SKF", articleNumber: "VKPC 85314" },
    { articleName: "Thermostat", brandName: "Wahler", articleNumber: "4174.92D" },
    { articleName: "Coolant Expansion Tank", brandName: "Febi Bilstein", articleNumber: "47896" },
    { articleName: "Radiator Fan Motor", brandName: "NRF", articleNumber: "47240" },
    { articleName: "Coolant Temperature Sensor", brandName: "FAE", articleNumber: "33735" },
  ],
  steering: [
    { articleName: "Tie Rod End", brandName: "TRW", articleNumber: "JTE1016" },
    { articleName: "Power Steering Pump", brandName: "ZF", articleNumber: "7693 955 303" },
    { articleName: "Steering Rack Boot Kit", brandName: "Lemförder", articleNumber: "33714 01" },
    { articleName: "Inner Tie Rod", brandName: "Meyle", articleNumber: "616 031 0004" },
    { articleName: "Steering Column Joint", brandName: "Febi Bilstein", articleNumber: "34681" },
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
