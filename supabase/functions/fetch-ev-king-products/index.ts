// Fetch EV King products from Awin product feed (live, in-memory cached).
// Mirrors the pattern used by `awin-product-feed` (Green Spark Plug):
//  1. Fetch the publisher's feedList from ui.awin.com.
//  2. Find the row for advertiser 22473 (EV King) and use its feed URL
//     (which contains the *real* feed id — not necessarily 22473).
//  3. Download the gzipped CSV, decompress, parse.
//  4. Return up to 50 products as JSON, cached in-memory for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ADVERTISER_ID = "22473"; // EV King / EV Cable Shop
const PUBLISHER_ID = "2845282";
const AFFILIATE_ID = PUBLISHER_ID;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedProducts {
  fetchedAt: number;
  products: unknown[];
}
let cache: CachedProducts | null = null;

// Minimal RFC4180-ish CSV parser supporting quoted fields with embedded commas/newlines.
function parseCsv(text: string): string[][] {
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
      else if (c === "\r") { /* ignore */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function findEvKingFeedUrl(apiKey: string): Promise<string | null> {
  const feedListUrl = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${apiKey}/1/feedList`;
  console.log("Fetching Awin feedList:", feedListUrl.replace(apiKey, "***"));
  const res = await fetch(feedListUrl);
  console.log("feedList status:", res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("feedList error body:", body.slice(0, 300));
    return null;
  }
  const csv = await res.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) {
    console.warn("feedList empty");
    return null;
  }
  const header = rows[0].map((h) => h.trim());
  const advIdx = header.findIndex((h) => h.toLowerCase().includes("advertiser id"));
  const urlIdx = header.findIndex((h) => h.toLowerCase() === "url");
  console.log("feedList header:", header, "advIdx:", advIdx, "urlIdx:", urlIdx);
  if (advIdx < 0 || urlIdx < 0) return null;

  const matched: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const id = (rows[i][advIdx] || "").trim();
    if (id === ADVERTISER_ID) {
      matched.push((rows[i][urlIdx] || "").trim());
    }
  }
  console.log(`feedList rows for advertiser ${ADVERTISER_ID}:`, matched.length);
  if (matched.length === 0) {
    // Helpful debug: list distinct advertiser ids the publisher does have.
    const ids = new Set<string>();
    for (let i = 1; i < rows.length; i++) ids.add((rows[i][advIdx] || "").trim());
    console.warn("EV King not in feedList. Available advertiser IDs:", Array.from(ids).slice(0, 50));
    return null;
  }
  return matched[0];
}

async function fetchFeedText(feedUrl: string): Promise<string | null> {
  console.log("Fetching feed:", feedUrl.replace(/apikey\/[^/]+/, "apikey/***"));
  const res = await fetch(feedUrl, { redirect: "follow" });
  console.log("Feed status:", res.status, "content-type:", res.headers.get("content-type"));
  if (!res.ok || !res.body) {
    const body = await res.clone().text().catch(() => "");
    console.error("Feed fetch error body:", body.slice(0, 300));
    return null;
  }
  if (feedUrl.includes("compression/gzip")) {
    const decompressed = res.body.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(decompressed).text();
  }
  return await res.text();
}

async function loadProducts(apiKey: string): Promise<unknown[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.products;
  }

  const feedUrl = await findEvKingFeedUrl(apiKey);
  if (!feedUrl) return [];

  const csvText = await fetchFeedText(feedUrl);
  if (!csvText) return [];

  const rows = parseCsv(csvText);
  console.log("Parsed CSV rows:", rows.length);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iId = idx("aw_product_id");
  const iName = idx("product_name");
  const iDesc = idx("description");
  const iPrice = idx("search_price");
  const iImg = idx("merchant_image_url");
  const iAwImg = idx("aw_image_url");
  const iAwDeep = idx("aw_deep_link");
  const iMerchDeep = idx("merchant_deep_link");
  const iCat = idx("merchant_category");
  const iStock = idx("in_stock");

  const products: unknown[] = [];
  for (let r = 1; r < rows.length && products.length < 50; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    const merchantDeep = iMerchDeep >= 0 ? row[iMerchDeep] : "";
    const awDeep = iAwDeep >= 0 ? row[iAwDeep] : "";
    if (!merchantDeep && !awDeep) continue;

    const priceNum = iPrice >= 0 ? parseFloat(row[iPrice]) : 0;
    const stockRaw = iStock >= 0 ? (row[iStock] || "").toLowerCase().trim() : "1";
    const inStock = stockRaw === "1" || stockRaw === "true" || stockRaw === "yes" || stockRaw === "";

    // Always build affiliate URL with the publisher's awin1.com tracker.
    const affiliateUrl = merchantDeep
      ? `https://www.awin1.com/cread.php?awinmid=${ADVERTISER_ID}&awinaffid=${AFFILIATE_ID}&ued=${encodeURIComponent(merchantDeep)}`
      : awDeep;

    products.push({
      id: iId >= 0 && row[iId] ? row[iId] : String(r),
      name: iName >= 0 ? row[iName] : "",
      description: iDesc >= 0 ? row[iDesc] : "",
      price: isNaN(priceNum) ? 0 : priceNum,
      image_url: (iImg >= 0 && row[iImg]) ? row[iImg] : (iAwImg >= 0 ? row[iAwImg] : ""),
      affiliate_url: affiliateUrl,
      category: iCat >= 0 ? row[iCat] : "",
      in_stock: inStock,
      supplier: "EV King",
    });
  }

  cache = { fetchedAt: Date.now(), products };
  return products;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AWIN_API_KEY");
    if (!apiKey) {
      console.error("AWIN_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AWIN_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const products = await loadProducts(apiKey);

    return new Response(JSON.stringify(products), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("fetch-ev-king-products error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
