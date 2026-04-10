import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT } from "../_shared/security.ts";

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  langId: z.number().int().optional().default(4),
  countryFilterId: z.number().int().optional().default(62),
  // diagnostic mode - try multiple endpoints to find working ones
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

    // Diagnostic mode: try many endpoint patterns to discover the correct API structure
    if (diagnostic) {
      const testPaths = [
        `/getAllLanguages`,
        `/getManufacturers?typeId=1&langId=${langId}&countryFilterId=${countryFilterId}`,
        `/listVehicleTypes`,
        `/getAllCountries`,
        `/languages/list`,
        `/countries/list`,
        `/manufacturers?typeId=1&langId=${langId}&countryFilterId=${countryFilterId}`,
        `/v1/manufacturers?typeId=1&langId=${langId}&countryFilterId=${countryFilterId}`,
      ];

      const diagnosticResults: any[] = [];
      for (const path of testPaths) {
        const result = await rapidFetch(path, RAPIDAPI_KEY);
        diagnosticResults.push({
          path,
          status: result.status,
          ok: result.ok,
          sample: typeof result.data === 'string' ? result.data.slice(0, 200) : JSON.stringify(result.data)?.slice(0, 200),
        });
      }
      return jsonResponse({ diagnostic: true, results: diagnosticResults }, 200, corsHeaders);
    }

    // Normal search flow - try known endpoint patterns
    const searchPaths = [
      `/getManufacturers?typeId=1&langId=${langId}&countryFilterId=${countryFilterId}`,
      `/getAllLanguages`,
    ];

    // For now return empty until we discover working endpoints
    return jsonResponse({ results: [] }, 200, corsHeaders);
  } catch (error) {
    console.error("[search-auto-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", results: [] }, 200, corsHeaders);
  }
});
