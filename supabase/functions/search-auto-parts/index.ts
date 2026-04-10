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

    const { query, langId } = parsed.data;
    const results: any[] = [];

    // Try searching by article number - this is the primary search endpoint
    // The API uses path-based params: /articles/search-by-article-no/lang-id/{langId}/article-no/{articleNo}
    // Note: Some endpoints require PRO plan. We try multiple patterns and gracefully handle 404s.
    
    const searchEndpoints = [
      `/articles/search?langId=${langId}&articleSearchNr=${encodeURIComponent(query)}`,
      `/search/articles?langId=${langId}&articleSearchNr=${encodeURIComponent(query)}`,
    ];

    for (const endpoint of searchEndpoints) {
      try {
        const data = await rapidFetch(endpoint, RAPIDAPI_KEY);
        
        if (Array.isArray(data)) {
          for (const item of data) {
            results.push({
              id: `catalog-${item.articleId || item.id || results.length}`,
              partName: item.articleName || item.name || item.description || item.productGroupName || "Auto Part",
              partNumber: item.articleNo || item.articleNumber || "",
              brand: item.supplierName || item.brandName || "TecDoc Catalog",
              category: item.productGroupName || item.category || "",
              imageUrl: item.s3image || item.imageUrl || null,
              compatibility: null,
              source: "catalog",
            });
          }
          break; // Found working endpoint
        } else if (data && typeof data === "object") {
          const items = data.articles || data.items || data.results || data.data || [];
          if (Array.isArray(items)) {
            for (const item of items) {
              results.push({
                id: `catalog-${item.articleId || item.id || results.length}`,
                partName: item.articleName || item.name || item.description || "Auto Part",
                partNumber: item.articleNo || item.articleNumber || "",
                brand: item.supplierName || item.brandName || "TecDoc Catalog",
                category: item.productGroupName || item.category || "",
                imageUrl: item.s3image || item.imageUrl || null,
                compatibility: null,
                source: "catalog",
              });
            }
            if (items.length > 0) break;
          }
        }
      } catch (e) {
        // Endpoint not available on current plan, try next
        console.warn(`[search-auto-parts] Endpoint failed: ${endpoint}`);
        continue;
      }
    }

    // If no article search results, try to get supplier info as enrichment data
    if (results.length === 0) {
      try {
        const suppliers = await rapidFetch(`/suppliers/list?langId=${langId}`, RAPIDAPI_KEY);
        if (Array.isArray(suppliers)) {
          // Filter suppliers whose name matches part of the query
          const queryLower = query.toLowerCase();
          const matchingSuppliers = suppliers.filter((s: any) => 
            queryLower.includes(s.supplierName?.toLowerCase()) || 
            s.supplierName?.toLowerCase().includes(queryLower.split(' ')[0])
          ).slice(0, 5);
          
          for (const supplier of matchingSuppliers) {
            results.push({
              id: `supplier-${supplier.supplierId}`,
              partName: `${supplier.supplierName} Parts`,
              partNumber: "",
              brand: supplier.supplierName,
              category: "Supplier",
              imageUrl: supplier.s3image || null,
              compatibility: null,
              source: "catalog",
            });
          }
        }
      } catch {
        // Suppliers list also failed
      }
    }

    return jsonResponse({ results: results.slice(0, 20) }, 200, corsHeaders);
  } catch (error) {
    console.error("[search-auto-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", results: [] }, 200, corsHeaders);
  }
});
