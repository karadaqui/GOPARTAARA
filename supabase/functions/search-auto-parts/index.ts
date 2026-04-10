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
  const url = `${RAPIDAPI_BASE}${path}`;
  console.log(`[search-auto-parts] Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RapidAPI ${res.status}: ${text.slice(0, 300)}`);
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
    console.error("[search-auto-parts] RAPIDAPI_KEY not configured");
    return jsonResponse({ error: "API not configured", results: [] }, 200, corsHeaders);
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors, results: [] }, 400, corsHeaders);
    }

    const { query, langId, countryFilterId } = parsed.data;

    // The Auto Parts Catalog API uses specific endpoint names.
    // For text-based search, we use /searchArticlesByNumber which searches by article/part number.
    // We also try the commodity group tree search for keyword-based queries.
    
    const results: any[] = [];

    // Strategy 1: Search articles by number (works for part numbers like "C 2029")
    try {
      const articleData = await rapidFetch(
        `/searchArticlesByNumber?articleSearchNr=${encodeURIComponent(query)}&langId=${langId}`,
        RAPIDAPI_KEY
      );
      console.log(`[search-auto-parts] articleSearch response type: ${typeof articleData}, isArray: ${Array.isArray(articleData)}`);
      console.log(`[search-auto-parts] articleSearch sample:`, JSON.stringify(articleData)?.slice(0, 500));
      
      if (Array.isArray(articleData)) {
        for (const item of articleData) {
          results.push({
            id: `catalog-${item.articleId || item.id || results.length}`,
            partName: item.articleName || item.name || item.description || item.productGroupName || "Auto Part",
            partNumber: item.articleNo || item.articleNumber || "",
            brand: item.supplierName || item.brandName || item.supplier || "TecDoc Catalog",
            category: item.productGroupName || item.category || "",
            imageUrl: item.s3image || item.imageUrl || item.image || null,
            compatibility: null,
            source: "catalog",
          });
        }
      } else if (articleData && typeof articleData === "object") {
        // Could be wrapped in an object
        const items = articleData.articles || articleData.items || articleData.results || articleData.data || [];
        for (const item of (Array.isArray(items) ? items : [])) {
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
      }
    } catch (e: any) {
      console.warn(`[search-auto-parts] searchArticlesByNumber failed:`, e.message);
    }

    // Strategy 2: If no results from article search, try OEM number search
    if (results.length === 0) {
      try {
        const oemData = await rapidFetch(
          `/searchArticlesByOEMNumber?oemNumber=${encodeURIComponent(query)}&langId=${langId}`,
          RAPIDAPI_KEY
        );
        console.log(`[search-auto-parts] oemSearch response:`, JSON.stringify(oemData)?.slice(0, 500));
        
        if (Array.isArray(oemData)) {
          for (const item of oemData) {
            results.push({
              id: `catalog-${item.articleId || item.id || results.length}`,
              partName: item.articleName || item.name || item.description || "Auto Part",
              partNumber: item.articleNo || item.articleNumber || item.oemNumber || "",
              brand: item.supplierName || item.brandName || "TecDoc Catalog",
              category: item.productGroupName || "",
              imageUrl: item.s3image || item.imageUrl || null,
              compatibility: null,
              source: "catalog",
            });
          }
        }
      } catch (e: any) {
        console.warn(`[search-auto-parts] searchByOEM failed:`, e.message);
      }
    }

    console.log(`[search-auto-parts] Total parsed results: ${results.length}`);
    return jsonResponse({ results: results.slice(0, 20) }, 200, corsHeaders);
  } catch (error) {
    console.error("[search-auto-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", results: [] }, 200, corsHeaders);
  }
});
