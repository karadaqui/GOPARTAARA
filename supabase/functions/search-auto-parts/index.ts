import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT } from "../_shared/security.ts";

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  langId: z.number().int().optional().default(4),
  countryFilterId: z.number().int().optional().default(62),
  diagnostic: z.boolean().optional().default(false),
});

async function rapidFetch(path: string, apiKey: string): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${RAPIDAPI_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// Add delay between requests to avoid rate limiting
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    const { query, langId, countryFilterId, diagnostic } = parsed.data;

    if (diagnostic) {
      const testPaths = [
        `/manufacturers/list?typeId=1&langId=${langId}&countryFilterId=${countryFilterId}`,
        `/articles/search-by-article-no/lang-id/${langId}/article-no/${encodeURIComponent(query)}`,
        `/articles/search?langId=${langId}&query=${encodeURIComponent(query)}`,
        `/categories/search-by-description?langId=${langId}&countryFilterId=${countryFilterId}&description=${encodeURIComponent(query)}`,
      ];

      const diagnosticResults: any[] = [];
      for (const path of testPaths) {
        await delay(1100); // 1 req/sec for BASIC plan
        const result = await rapidFetch(path, RAPIDAPI_KEY);
        diagnosticResults.push({
          path,
          status: result.status,
          ok: result.ok,
          sample: typeof result.data === 'string' ? result.data.slice(0, 300) : JSON.stringify(result.data)?.slice(0, 300),
        });
      }
      return jsonResponse({ diagnostic: true, results: diagnosticResults }, 200, corsHeaders);
    }

    // Normal search - try article search endpoint
    const searchResult = await rapidFetch(
      `/articles/search-by-article-no/lang-id/${langId}/article-no/${encodeURIComponent(query)}`,
      RAPIDAPI_KEY
    );

    const results: any[] = [];
    if (searchResult.ok && Array.isArray(searchResult.data)) {
      for (const item of searchResult.data) {
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

    return jsonResponse({ results: results.slice(0, 20) }, 200, corsHeaders);
  } catch (error) {
    console.error("[search-auto-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", results: [] }, 200, corsHeaders);
  }
});
