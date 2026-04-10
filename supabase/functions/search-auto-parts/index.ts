import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT } from "../_shared/security.ts";

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  langId: z.number().int().optional().default(4), // English
  countryFilterId: z.number().int().optional().default(62), // Germany (broadest catalog)
});

async function rapidFetch(path: string, apiKey: string): Promise<any> {
  const res = await fetch(`${RAPIDAPI_BASE}${path}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RapidAPI ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  const auth = await validateJWT(req, corsHeaders);
  if (auth.error) return auth.error;

  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  if (!RAPIDAPI_KEY) {
    return jsonResponse({ error: "API not configured", results: [] }, 200, corsHeaders);
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors, results: [] }, 400, corsHeaders);
    }

    const { query, langId, countryFilterId } = parsed.data;

    // Use the category search by description endpoint to find matching product groups
    const searchPath = `/api/search/description?langId=${langId}&countryFilterId=${countryFilterId}&description=${encodeURIComponent(query)}`;
    
    let searchData: any;
    try {
      searchData = await rapidFetch(searchPath, RAPIDAPI_KEY);
    } catch (e) {
      console.error("[search-auto-parts] API error:", e);
      return jsonResponse({ error: "SERVICE_UNAVAILABLE", results: [] }, 200, corsHeaders);
    }

    // Parse results - the API returns a tree structure of categories with products
    const results: any[] = [];
    
    if (Array.isArray(searchData)) {
      for (const category of searchData) {
        if (category.children && Array.isArray(category.children)) {
          for (const sub of category.children) {
            if (sub.children && Array.isArray(sub.children)) {
              for (const item of sub.children) {
                results.push({
                  id: `catalog-${item.productGroupId || item.id || results.length}`,
                  partName: item.name || item.description || "Auto Part",
                  partNumber: item.articleNo || item.productGroupId?.toString() || "",
                  brand: item.supplierName || item.brand || category.name || "TecDoc Catalog",
                  category: sub.name || category.name || "",
                  imageUrl: item.s3image || item.imageUrl || null,
                  compatibility: item.vehicles || item.compatibility || null,
                  source: "catalog",
                });
              }
            } else {
              // sub itself is a product
              results.push({
                id: `catalog-${sub.productGroupId || sub.id || results.length}`,
                partName: sub.name || sub.description || "Auto Part",
                partNumber: sub.articleNo || sub.productGroupId?.toString() || "",
                brand: sub.supplierName || sub.brand || category.name || "TecDoc Catalog",
                category: category.name || "",
                imageUrl: sub.s3image || sub.imageUrl || null,
                compatibility: null,
                source: "catalog",
              });
            }
          }
        }
      }
    } else if (searchData && typeof searchData === "object") {
      // Single result or different structure
      const items = searchData.items || searchData.articles || searchData.results || [];
      for (const item of (Array.isArray(items) ? items : [])) {
        results.push({
          id: `catalog-${item.articleId || item.id || results.length}`,
          partName: item.name || item.articleName || item.description || "Auto Part",
          partNumber: item.articleNo || item.articleNumber || "",
          brand: item.supplierName || item.brandName || "TecDoc Catalog",
          category: item.productGroupName || item.category || "",
          imageUrl: item.s3image || item.imageUrl || null,
          compatibility: null,
          source: "catalog",
        });
      }
    }

    return jsonResponse({ results: results.slice(0, 20) }, 200, corsHeaders);
  } catch (error) {
    console.error("[search-auto-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", results: [] }, 200, corsHeaders);
  }
});
