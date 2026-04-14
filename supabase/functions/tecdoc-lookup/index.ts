import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

const BodySchema = z.object({
  action: z.enum(["search_vehicle", "get_parts"]),
  make: z.string().min(1).max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().optional(),
  vehicleId: z.number().int().optional(),
  category: z.string().max(100).optional(),
});

async function tecdocFetch(path: string, apiKey: string): Promise<any> {
  const res = await fetch(`${RAPIDAPI_BASE}${path}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[tecdoc] ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(`TecDoc API ${res.status}`);
  }
  return res.json();
}

// Map friendly category names to TecDoc assembly group IDs
const CATEGORY_MAP: Record<string, number[]> = {
  Brakes: [102, 103, 104, 105],
  Engine: [100, 101, 107, 109],
  Suspension: [106, 108, 110],
  Filters: [111, 112, 113, 114],
  Exhaust: [115, 116],
  Electrics: [117, 118, 119, 120],
  Cooling: [121, 122, 123],
  Body: [124, 125, 126, 127],
  Steering: [128, 129, 130],
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_TECDOC_KEY");
  if (!RAPIDAPI_KEY) {
    return jsonResponse({ error: "TecDoc API not configured" }, 200, corsHeaders);
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400, corsHeaders);
    }

    const { action } = parsed.data;

    if (action === "search_vehicle") {
      const { make, model, year } = parsed.data;
      if (!make) {
        return jsonResponse({ error: "make is required" }, 400, corsHeaders);
      }

      const query = `${make} ${model || ""} ${year || ""}`.trim();
      
      // Try multiple search approaches
      let vehicles: any[] = [];

      // Approach 1: search by query string
      try {
        const data = await tecdocFetch(
          `/api/vehicles/search?query=${encodeURIComponent(query)}&lang=en`,
          RAPIDAPI_KEY
        );
        if (Array.isArray(data)) {
          vehicles = data;
        } else if (data?.vehicles) {
          vehicles = data.vehicles;
        } else if (data?.data) {
          vehicles = Array.isArray(data.data) ? data.data : [];
        }
      } catch (e) {
        console.warn("[tecdoc] Vehicle search failed:", e);
      }

      // Approach 2: if no results, try make + model separately
      if (vehicles.length === 0 && model) {
        try {
          const data = await tecdocFetch(
            `/api/vehicles/search?query=${encodeURIComponent(make)}&lang=en`,
            RAPIDAPI_KEY
          );
          const all = Array.isArray(data) ? data : (data?.vehicles || data?.data || []);
          const modelLower = model.toLowerCase();
          vehicles = all.filter((v: any) =>
            (v.name || v.description || "").toLowerCase().includes(modelLower)
          );
        } catch {
          // ignore
        }
      }

      const mapped = vehicles.slice(0, 10).map((v: any) => ({
        id: v.id || v.vehicleId || v.kTypeId || v.ktypeId,
        name: v.name || v.description || v.fullName || `${make} ${model || ""}`,
        make: v.make || v.manufacturer || make,
        model: v.model || model || "",
        year: v.year || v.yearFrom || year,
        ktype: v.kTypeId || v.ktypeId || v.id,
      }));

      return jsonResponse({ vehicles: mapped }, 200, corsHeaders);
    }

    if (action === "get_parts") {
      const { vehicleId, category } = parsed.data;
      if (!vehicleId) {
        return jsonResponse({ error: "vehicleId is required" }, 400, corsHeaders);
      }

      const parts: any[] = [];

      // Try to get articles/parts for this vehicle
      const endpoints = [
        `/api/vehicles/${vehicleId}/articles?lang=en`,
        `/api/articles/search?vehicleId=${vehicleId}&lang=en`,
      ];

      // If category is specified, try category-specific endpoint
      if (category && CATEGORY_MAP[category]) {
        const groupIds = CATEGORY_MAP[category].join(",");
        endpoints.unshift(
          `/api/vehicles/${vehicleId}/articles?assemblyGroupIds=${groupIds}&lang=en`
        );
      }

      for (const endpoint of endpoints) {
        try {
          const data = await tecdocFetch(endpoint, RAPIDAPI_KEY);
          const items = Array.isArray(data) ? data : (data?.articles || data?.items || data?.data || []);
          
          if (Array.isArray(items) && items.length > 0) {
            for (const item of items.slice(0, 30)) {
              parts.push({
                id: item.articleId || item.id || parts.length,
                name: item.articleName || item.name || item.description || "Auto Part",
                brand: item.brandName || item.supplierName || item.manufacturer || "",
                oemNumber: item.articleNumber || item.oemNumber || item.articleNo || "",
                category: item.assemblyGroupName || item.categoryName || category || "",
                imageUrl: item.imageUrl || item.s3image || null,
              });
            }
            break;
          }
        } catch (e) {
          console.warn(`[tecdoc] Parts endpoint failed: ${endpoint}`);
          continue;
        }
      }

      return jsonResponse({ parts }, 200, corsHeaders);
    }

    return jsonResponse({ error: "Invalid action" }, 400, corsHeaders);
  } catch (error) {
    console.error("[tecdoc-lookup] Error:", error);
    return jsonResponse({ error: "SERVICE_FAILED" }, 200, corsHeaders);
  }
});
