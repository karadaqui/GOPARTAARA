// Fetches EV King (advertiser 22473) product feed via Awin and returns JSON.
// Cached in-memory for 1 hour.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = "22473";
const PUBLISHER_ID = "2845282";
const CACHE_TTL_MS = 60 * 60 * 1000;

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  affiliate_url: string;
  brand: string;
  category: string;
}

let cache: { fetchedAt: number; products: Product[] } | null = null;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function decompressGzip(buf: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const stream = new Response(buf).body!.pipeThrough(ds);
  return await new Response(stream).text();
}

function buildAffiliateUrl(deepLink: string): string {
  return `https://www.awin1.com/cread.php?awinmid=${ADVERTISER_ID}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(deepLink)}`;
}

async function loadProducts(apiKey: string): Promise<Product[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.products;

  const columns = [
    "aw_product_id", "product_name", "description", "merchant_product_id",
    "merchant_image_url", "search_price", "merchant_deep_link",
    "brand_name", "category_name",
  ].join("%2C");

  const feedUrl =
    `https://productdata.awin.com/datafeed/download/apikey/${apiKey}/` +
    `language/en/fid/${ADVERTISER_ID}/columns/${columns}/` +
    `format/csv/delimiter/%2C/compression/gzip/adultcontent/1/`;

  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);

  const buf = await res.arrayBuffer();
  const csvText = await decompressGzip(buf);
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    cache = { fetchedAt: now, products: [] };
    return [];
  }

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const iId = idx("aw_product_id");
  const iName = idx("product_name");
  const iDesc = idx("description");
  const iImg = idx("merchant_image_url");
  const iPrice = idx("search_price");
  const iLink = idx("merchant_deep_link");
  const iBrand = idx("brand_name");
  const iCat = idx("category_name");

  const products: Product[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const deepLink = r[iLink] || "";
    if (!deepLink.startsWith("http")) continue;
    const priceNum = parseFloat(r[iPrice] || "0");
    products.push({
      id: r[iId] || String(i),
      name: r[iName] || "",
      description: r[iDesc] || "",
      price: priceNum > 0 ? `£${priceNum.toFixed(2)}` : "",
      image_url: r[iImg] || "",
      affiliate_url: buildAffiliateUrl(deepLink),
      brand: r[iBrand] || "EV King",
      category: r[iCat] || "",
    });
  }

  cache = { fetchedAt: now, products };
  return products;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("AWIN_API_TOKEN") || Deno.env.get("AWIN_API_KEY");
    if (!apiKey) throw new Error("AWIN API key not configured");
    const all = await loadProducts(apiKey);
    return new Response(JSON.stringify({ products: all.slice(0, 50) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-ev-king-products error", e);
    return new Response(
      JSON.stringify({ products: [], error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
