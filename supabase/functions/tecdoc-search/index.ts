import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const BodySchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  year: z.number().int().optional(),
  category: z.string().min(1).max(100),
});

// Map user-friendly categories to specific part search terms
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  brakes: ["brake pad", "brake disc", "brake caliper"],
  engine: ["oil filter", "spark plug", "timing belt"],
  suspension: ["shock absorber", "coil spring", "control arm"],
  filters: ["air filter", "oil filter", "fuel filter", "cabin filter"],
  exhaust: ["exhaust pipe", "catalytic converter", "muffler"],
  electrics: ["alternator", "starter motor", "ignition coil"],
  cooling: ["radiator", "water pump", "thermostat"],
  steering: ["tie rod", "power steering pump", "steering rack"],
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_TECDOC_KEY");
  if (!RAPIDAPI_KEY) {
    return jsonResponse({ error: "TecDoc API not configured", articles: [] }, 200, corsHeaders);
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400, corsHeaders);
    }

    const { make, model, year, category } = parsed.data;
    const searchTerms = CATEGORY_SEARCH_TERMS[category] || [category];
    
    console.log(`[tecdoc-search] Category: ${category}, Make: ${make}, Terms: ${searchTerms.join(", ")}`);

    const allArticles: any[] = [];

    // Search for each term in the category using the correct endpoint
    for (const term of searchTerms) {
      const searchQuery = encodeURIComponent(term);
      const url = `https://${RAPIDAPI_HOST}/articles/search/lang-id/4/article-search/${searchQuery}`;
      
      console.log(`[tecdoc-search] Fetching: ${url}`);
      
      try {
        const res = await fetch(url, {
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
        });

        const text = await res.text();
        console.log(`[tecdoc-search] ${term} → ${res.status}, length: ${text.length}`);

        if (res.ok) {
          try {
            const data = JSON.parse(text);
            const items = Array.isArray(data) ? data 
              : data?.articles || data?.items || data?.data || data?.results || [];
            if (Array.isArray(items)) {
              allArticles.push(...items);
            }
          } catch { /* parse error, skip */ }
        }
      } catch (e) {
        console.error(`[tecdoc-search] Fetch error for "${term}":`, e);
      }

      if (allArticles.length >= 30) break;
    }

    // Deduplicate by articleNumber and map to clean format
    const seen = new Set<string>();
    const mapped = allArticles
      .filter((item: any) => {
        const num = item.articleNumber || item.articleNo || item.articleNr || "";
        if (!num || seen.has(num)) return false;
        seen.add(num);
        return true;
      })
      .slice(0, 30)
      .map((item: any) => ({
        articleName: item.articleName || item.name || item.description || item.genericArticleDescription || "Auto Part",
        brandName: item.brandName || item.supplierName || item.manufacturer || item.mfrName || "",
        articleNumber: item.articleNumber || item.articleNo || item.articleNr || "",
      }));

    console.log(`[tecdoc-search] Returning ${mapped.length} unique articles`);
    return jsonResponse({ articles: mapped }, 200, corsHeaders);
  } catch (error) {
    console.error("[tecdoc-search] Error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", articles: [], fallback: true }, 200, corsHeaders);
  }
});
