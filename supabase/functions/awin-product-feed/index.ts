// AWIN product feed proxy for Green Spark Plug Co. (advertiser 16976, feed 32377)
// 1. Fetch the CSV feed list, locate the GSP row, get its gzipped CSV download URL.
// 2. Download + gunzip + parse the product CSV.
// 3. Filter by query, return up to 6 products.
// Cached in-memory for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = "16976";
const PUBLISHER_ID = "2845282";
const FEED_TOKEN = "f0b723c9643205a96aeb31377b805e02";
const FEED_LIST_URL = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${FEED_TOKEN}/1/feedList`;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface ProductSpecs {
  partNumber: string;
  brand: string;
  manufacturer: string;
  packSize: string;
  barcode: string;
  diameter: string;
  reach: string;
  hex: string;
  thread: string;
  electrode: string;
  resistor: string;
  seal: string;
  tip: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  description: string;
  inStock: boolean;
  supplier: string;
  supplierName: string;
  condition: string;
  sku: string;
  barcode: string;
  category: string;
  specs: ProductSpecs;
}

function extractSpec(description: string, key: string): string {
  if (!description) return "";
  const regex = new RegExp(key + "[:\\s]+([^\\n,;|]+)", "i");
  const match = description.match(regex);
  return match ? match[1].trim().replace(/\.$/, "") : "";
}

interface RawProduct {
  aw_product_id?: string;
  product_name?: string;
  description?: string;
  search_price?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  aw_deep_link?: string;
  brand_name?: string;
  delivery_cost?: string;
  in_stock?: string;
  currency?: string;
}

let feedCache: { fetchedAt: number; products: RawProduct[] } | null = null;

// Minimal CSV parser supporting quoted fields with embedded commas/quotes/newlines.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function decompressGzip(buf: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const stream = new Response(buf).body!.pipeThrough(ds);
  const text = await new Response(stream).text();
  return text;
}

async function findGspFeedUrl(): Promise<string | null> {
  const res = await fetch(FEED_LIST_URL);
  if (!res.ok) {
    throw new Error(`feedList fetch failed: ${res.status}`);
  }
  const csv = await res.text();
  const rows = parseCSV(csv);
  if (rows.length < 2) return null;
  const header = rows[0];
  const idIdx = header.findIndex((h) => h.trim() === "Advertiser ID");
  const urlIdx = header.findIndex((h) => h.trim() === "URL");
  if (idIdx === -1 || urlIdx === -1) return null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx] === ADVERTISER_ID) {
      return rows[i][urlIdx];
    }
  }
  return null;
}

async function loadFeed(): Promise<RawProduct[]> {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < CACHE_TTL_MS) {
    return feedCache.products;
  }

  const feedUrl = await findGspFeedUrl();
  if (!feedUrl) {
    throw new Error("Green Spark Plug feed not found in feed list");
  }

  const feedRes = await fetch(feedUrl);
  if (!feedRes.ok) {
    throw new Error(`product feed fetch failed: ${feedRes.status}`);
  }

  // The URL ends with compression/gzip — decompress.
  const buf = await feedRes.arrayBuffer();
  const csvText = feedUrl.includes("compression/gzip")
    ? await decompressGzip(buf)
    : new TextDecoder().decode(buf);

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    feedCache = { fetchedAt: now, products: [] };
    return [];
  }
  const header = rows[0].map((h) => h.trim());
  const products: RawProduct[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = r[j] ?? "";
    }
    products.push(obj as RawProduct);
  }

  feedCache = { fetchedAt: now, products };
  return products;
}

function processProducts(products: RawProduct[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return products
    .filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    .slice(0, 6)
    .map((p) => {
      const priceNum = parseFloat(p.search_price || "0");
      const deliveryNum = parseFloat(p.delivery_cost || "0");
      const currency = (p.currency || "GBP").toUpperCase();
      const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
      let shipping = "See site for delivery";
      if (!p.delivery_cost || deliveryNum === 0) {
        shipping = "Free delivery";
      } else if (!isNaN(deliveryNum) && deliveryNum > 0) {
        shipping = `${symbol}${deliveryNum.toFixed(2)} delivery`;
      }
      const pAny = p as Record<string, string>;
      const rawDesc =
        pAny.description ||
        pAny.product_description ||
        pAny.short_description ||
        pAny.aw_description ||
        "";
      const partNumber =
        pAny.part_number || pAny.mpn || pAny.sku || pAny.merchant_product_id || "";
      const barcode = pAny.ean || pAny.upc || pAny.isbn || "";
      return {
        id: p.aw_product_id || "",
        title: p.product_name || "",
        price: isNaN(priceNum) || priceNum === 0
          ? (p.search_price || "")
          : `${symbol}${priceNum.toFixed(2)}`,
        image: p.merchant_image_url || p.aw_image_url || "",
        url: p.aw_deep_link || p.merchant_deep_link || "",
        brand: p.brand_name || "Green Spark Plug Co.",
        shipping,
        description: rawDesc,
        inStock: (p.in_stock || "").toString().toLowerCase() === "yes" || p.in_stock === "1",
        supplier: "greensparkplug",
        supplierName: "Green Spark Plug Co.",
        condition: pAny.condition || "New",
        sku: partNumber,
        barcode,
        category: pAny.category_name || pAny.merchant_category || pAny.aw_category || "",
        specs: {
          partNumber,
          brand: p.brand_name || "",
          manufacturer: pAny.manufacturer || p.brand_name || "",
          packSize: pAny.pack_size || pAny.package_size || "",
          barcode,
          diameter: extractSpec(rawDesc, "Diameter"),
          reach: extractSpec(rawDesc, "Reach"),
          hex: extractSpec(rawDesc, "Hex"),
          thread: extractSpec(rawDesc, "Thread"),
          electrode: extractSpec(rawDesc, "Electrode"),
          resistor: extractSpec(rawDesc, "Resistor"),
          seal: extractSpec(rawDesc, "Seal"),
          tip: extractSpec(rawDesc, "Tip"),
        },
      };
    });
}

// Map noisy scraped labels to our canonical spec keys (matches SPEC_LABELS in the card).
const SPEC_KEY_MAP: Record<string, string> = {
  "diameter": "diameter",
  "thread diameter": "diameter",
  "reach": "reach",
  "thread reach": "reach",
  "hex": "hex",
  "hex size": "hex",
  "hex spanner size": "hex",
  "spanner size": "hex",
  "thread": "thread",
  "thread type": "thread",
  "thread pitch": "thread",
  "electrode": "electrode",
  "electrode material": "electrode",
  "centre electrode": "electrode",
  "center electrode": "electrode",
  "resistor": "resistor",
  "resistance": "resistor",
  "seal": "seal",
  "seal type": "seal",
  "gasket": "seal",
  "tip": "tip",
  "tip type": "tip",
  "part number": "partNumber",
  "part no": "partNumber",
  "part no.": "partNumber",
  "manufacturer part number": "partNumber",
  "mpn": "partNumber",
  "sku": "partNumber",
  "brand": "brand",
  "manufacturer": "manufacturer",
  "make": "manufacturer",
  "barcode": "barcode",
  "ean": "barcode",
  "upc": "barcode",
  "pack size": "packSize",
  "pack": "packSize",
  "package size": "packSize",
  "quantity": "packSize",
};

function normalizeSpecKey(rawKey: string): string | null {
  const k = rawKey.toLowerCase().replace(/[:*]+$/, "").replace(/\s+/g, " ").trim();
  return SPEC_KEY_MAP[k] || null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchProductSpecs(productUrl: string): Promise<Record<string, string>> {
  if (!productUrl) return {};
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const html = await res.text();

    const collected: Record<string, string> = {};

    const addSpec = (rawKey: string, rawVal: string) => {
      const value = decodeEntities(rawVal);
      if (!value || value === "-" || value.length > 200) return;
      const key = normalizeSpecKey(decodeEntities(rawKey));
      if (!key) return;
      if (!collected[key]) collected[key] = value;
    };

    // <th>Key</th><td>Value</td>
    const thTd = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m: RegExpExecArray | null;
    while ((m = thTd.exec(html)) !== null) addSpec(m[1], m[2]);

    // <tr><td>Key</td><td>Value</td></tr>
    const tdTd = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    while ((m = tdTd.exec(html)) !== null) addSpec(m[1], m[2]);

    // <dt>Key</dt><dd>Value</dd>
    const dtDd = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((m = dtDd.exec(html)) !== null) addSpec(m[1], m[2]);

    // "Key: value" plain-text fragments
    const lineLike = /(?:^|>)\s*([A-Z][A-Za-z .]{2,40})\s*:\s*([^<\n\r]{1,200})\s*(?:<|$)/gm;
    while ((m = lineLike.exec(html)) !== null) addSpec(m[1], m[2]);

    return collected;
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));
    const q = (query || "").toString();

    if (!q.trim()) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await loadFeed();
    const filtered = processProducts(products, q);

    // Enrich each result by scraping the product page for real spec tables.
    // Scraped values fill empty feed-derived fields; existing values are preserved.
    const enriched = await Promise.all(
      filtered.map(async (product) => {
        const scraped = await fetchProductSpecs(product.url);
        if (Object.keys(scraped).length === 0) return product;
        const mergedSpecs: Record<string, string> = { ...product.specs };
        for (const [k, v] of Object.entries(scraped)) {
          if (v && (!mergedSpecs[k] || mergedSpecs[k].trim() === "")) {
            mergedSpecs[k] = v;
          }
        }
        return { ...product, specs: mergedSpecs as unknown as typeof product.specs };
      }),
    );

    return new Response(JSON.stringify({ products: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("awin-product-feed error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, products: [] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
