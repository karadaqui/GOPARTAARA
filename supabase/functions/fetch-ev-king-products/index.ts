// Fetch EV King products from Awin product feed (gzipped CSV)
// Returns first 50 products as JSON

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FEED_FID = "22473";
const AFFILIATE_ID = "2845282";

function buildFeedUrl(apiKey: string): string {
  return `https://productdata.awin.com/datafeed/download/apikey/${apiKey}/fid/${FEED_FID}/format/csv/language/en/delimiter/%2C/compression/gzip/adultcontent/1/columns/aw_deep_link,product_name,aw_product_id,merchant_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,merchant_id,brand_name,in_stock,merchant_deep_link/`;
}

// Minimal RFC4180-ish CSV parser supporting quoted fields and embedded commas/newlines
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
        else { inQuotes = false; }
      } else {
        field += c;
      }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AWIN_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AWIN_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const feedUrl = buildFeedUrl(apiKey);
    console.log("Fetching Awin feed:", feedUrl.replace(apiKey, "***"));
    const feedRes = await fetch(feedUrl, { redirect: "follow" });
    console.log("Awin feed response status:", feedRes.status);
    if (!feedRes.ok || !feedRes.body) {
      let bodyText = "";
      try { bodyText = await feedRes.clone().text(); } catch { /* ignore */ }
      console.error("Awin feed error body:", bodyText.slice(0, 500));
      if (/no products found/i.test(bodyText)) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: `Feed fetch failed: ${feedRes.status}`, detail: bodyText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decompress gzip stream
    const decompressed = feedRes.body.pipeThrough(new DecompressionStream("gzip"));
    const csvText = await new Response(decompressed).text();

    const rows = parseCsv(csvText);
    console.log("Parsed CSV rows:", rows.length);
    if (rows.length < 2) {
      console.warn("Empty CSV — no products in feed");
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = rows[0].map((h) => h.trim());
    const idx = (name: string) => headers.indexOf(name);
    const iId = idx("aw_product_id");
    const iName = idx("product_name");
    const iDesc = idx("description");
    const iPrice = idx("search_price");
    const iImg = idx("merchant_image_url");
    const iDeep = idx("merchant_deep_link");
    const iCat = idx("merchant_category");
    const iStock = idx("in_stock");

    const products = [];
    for (let r = 1; r < rows.length && products.length < 50; r++) {
      const row = rows[r];
      if (!row || row.length < headers.length) continue;
      const rawDeep = iDeep >= 0 ? row[iDeep] : "";
      if (!rawDeep) continue;
      const priceNum = iPrice >= 0 ? parseFloat(row[iPrice]) : 0;
      const stockRaw = iStock >= 0 ? (row[iStock] || "").toLowerCase().trim() : "1";
      const inStock = stockRaw === "1" || stockRaw === "true" || stockRaw === "yes";
      products.push({
        id: iId >= 0 ? row[iId] : String(r),
        name: iName >= 0 ? row[iName] : "",
        description: iDesc >= 0 ? row[iDesc] : "",
        price: isNaN(priceNum) ? 0 : priceNum,
        image_url: iImg >= 0 ? row[iImg] : "",
        affiliate_url: `https://www.awin1.com/cread.php?awinmid=${FEED_FID}&awinaffid=${AFFILIATE_ID}&ued=${encodeURIComponent(rawDeep)}`,
        category: iCat >= 0 ? row[iCat] : "",
        in_stock: inStock,
      });
    }

    return new Response(JSON.stringify(products), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
