import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";

const BodySchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  year: z.number().int().optional(),
  category: z.string().min(1).max(100),
});

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

    const url = `https://${RAPIDAPI_HOST}/api/articles/search?query=${encodeURIComponent(query)}&lang=en`;

    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[tecdoc-search] ${res.status}: ${text.slice(0, 300)}`);
      return jsonResponse({ error: "SERVICE_UNAVAILABLE", articles: [], fallback: true }, 200, corsHeaders);
    }

    const data = await res.json();
    const articles = Array.isArray(data) ? data : (data?.articles || data?.items || data?.data || []);

    const mapped = articles.slice(0, 30).map((item: any) => ({
      articleName: item.articleName || item.name || item.description || "Auto Part",
      brandName: item.brandName || item.supplierName || item.manufacturer || "",
      articleNumber: item.articleNumber || item.oemNumber || item.articleNo || "",
    }));

    return jsonResponse({ articles: mapped }, 200, corsHeaders);
  } catch (error) {
    console.error("[tecdoc-search] Error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", articles: [], fallback: true }, 200, corsHeaders);
  }
});
