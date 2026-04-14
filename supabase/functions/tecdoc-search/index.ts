import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const BodySchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  year: z.number().int().optional(),
  category: z.string().min(1).max(100),
});

// Try multiple endpoint patterns to find one that works
async function searchTecDoc(query: string, apiKey: string): Promise<any[]> {
  const endpoints = [
    `/searchArticlesByNumber?articleSearchNr=${encodeURIComponent(query)}&langId=4`,
    `/articles/search-by-article-no/lang-id/4/article-no/${encodeURIComponent(query)}`,
    `/getArticlesList?langId=4&searchQuery=${encodeURIComponent(query)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `https://${RAPIDAPI_HOST}${endpoint}`;
      console.log(`[tecdoc-search] Trying: ${url}`);
      const res = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      });

      const text = await res.text();
      console.log(`[tecdoc-search] ${endpoint} → ${res.status}: ${text.slice(0, 500)}`);

      if (!res.ok) continue;

      try {
        const data = JSON.parse(text);
        const articles = Array.isArray(data) ? data
          : data?.articles || data?.items || data?.data || data?.results || [];
        if (Array.isArray(articles) && articles.length > 0) return articles;
      } catch { continue; }
    } catch (e) {
      console.error(`[tecdoc-search] Endpoint ${endpoint} failed:`, e);
    }
  }

  return [];
}

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
    const query = `${category} ${make} ${model || ""} ${year || ""}`.trim();

    console.log(`[tecdoc-search] Query: "${query}"`);

    const articles = await searchTecDoc(query, RAPIDAPI_KEY);

    const mapped = articles.slice(0, 30).map((item: any) => ({
      articleName: item.articleName || item.name || item.description || item.genericArticleDescription || "Auto Part",
      brandName: item.brandName || item.supplierName || item.manufacturer || item.mfrName || "",
      articleNumber: item.articleNumber || item.oemNumber || item.articleNo || item.articleNr || "",
    }));

    console.log(`[tecdoc-search] Returning ${mapped.length} articles`);
    return jsonResponse({ articles: mapped }, 200, corsHeaders);
  } catch (error) {
    console.error("[tecdoc-search] Error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", articles: [], fallback: true }, 200, corsHeaders);
  }
});
