// Shippo shipping label edge function.
// Two actions: get_rates -> POST /shipments, purchase_label -> POST /transactions.
// SHIPPO_API_KEY is read from env and never exposed to the client.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SHIPPO_BASE = "https://api.goshippo.com";

const HS_CODES: Record<string, string> = {
  "Engine Parts": "8409.99",
  "Body Parts": "8708.99",
  "Brakes": "8708.30",
  "Suspension": "8708.80",
  "Electrical": "8708.99",
  "Filters": "8421.31",
  "Exhaust": "8708.92",
  "Interior": "8708.99",
  "Cooling": "8708.99",
  "Transmission": "8708.40",
  "Body Panels": "8708.10",
  "Lighting": "8512.20",
  "Wheels & Tyres": "8708.70",
  "Other": "8708.99",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAddress(a: any): boolean {
  return a && typeof a === "object"
    && typeof a.name === "string" && a.name.trim()
    && typeof a.street1 === "string" && a.street1.trim()
    && typeof a.city === "string" && a.city.trim()
    && typeof a.zip === "string" && a.zip.trim()
    && typeof a.country === "string" && a.country.trim();
}

function isParcel(p: any): boolean {
  return p && [p.length, p.width, p.height, p.weight].every(
    (n) => typeof n === "number" && Number.isFinite(n) && n > 0,
  );
}

async function shippoFetch(path: string, apiKey: string, body: unknown): Promise<any> {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    console.error(`[shippo] ${path} ${res.status}`, text);
    throw new Error(parsed?.detail || parsed?.error || `Shippo error ${res.status}`);
  }
  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("SHIPPO_API_KEY");
  if (!apiKey) return jsonResponse({ error: "SHIPPO_API_KEY not configured" }, 500);

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await admin.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  let payload: any;
  try { payload = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

  const action = payload?.action;

  try {
    if (action === "get_rates") {
      const { address_from, address_to, parcel, category, carrier_preference } = payload;
      if (!isAddress(address_from)) return jsonResponse({ error: "Invalid address_from" }, 400);
      if (!isAddress(address_to))   return jsonResponse({ error: "Invalid address_to" }, 400);
      if (!isParcel(parcel))        return jsonResponse({ error: "Invalid parcel" }, 400);

      const shippoBody: any = {
        address_from: { ...address_from, validate: false },
        address_to:   { ...address_to, validate: false },
        parcels: [{
          length: String(parcel.length),
          width:  String(parcel.width),
          height: String(parcel.height),
          distance_unit: "cm",
          weight: String(parcel.weight),
          mass_unit: "kg",
        }],
        async: false,
      };

      // Customs declaration for international (UK <-> non-UK)
      const fromCountry = String(address_from.country).toUpperCase();
      const toCountry = String(address_to.country).toUpperCase();
      if (fromCountry !== toCountry) {
        const hsCode = (category && HS_CODES[category]) || HS_CODES["Other"];
        shippoBody.customs_declaration = {
          contents_type: "MERCHANDISE",
          contents_explanation: category || "Auto parts",
          non_delivery_option: "RETURN",
          certify: true,
          certify_signer: address_from.name,
          incoterm: "DDU",
          items: [{
            description: category || "Auto part",
            quantity: 1,
            net_weight: String(parcel.weight),
            mass_unit: "kg",
            value_amount: "20",
            value_currency: "GBP",
            origin_country: fromCountry,
            tariff_number: hsCode,
          }],
        };
      }

      const result = await shippoFetch("/shipments/", apiKey, shippoBody);
      let rates: any[] = result?.rates || [];
      if (carrier_preference && carrier_preference !== "Any") {
        const lower = carrier_preference.toLowerCase();
        const filtered = rates.filter(r => String(r.provider || "").toLowerCase().includes(lower));
        if (filtered.length > 0) rates = filtered;
      }
      // Sort cheapest first
      rates = rates.slice().sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      return jsonResponse({ rates, shipment_id: result?.object_id });
    }

    if (action === "purchase_label") {
      const { rate_id, order_id } = payload;
      if (typeof rate_id !== "string" || !rate_id) return jsonResponse({ error: "rate_id required" }, 400);
      if (typeof order_id !== "string" || !order_id) return jsonResponse({ error: "order_id required" }, 400);

      // Verify the requesting user is the seller on the order
      const { data: order, error: orderErr } = await admin
        .from("orders").select("id, seller_id").eq("id", order_id).maybeSingle();
      if (orderErr || !order) return jsonResponse({ error: "Order not found" }, 404);
      if (order.seller_id !== userId) return jsonResponse({ error: "Forbidden" }, 403);

      const txn = await shippoFetch("/transactions/", apiKey, {
        rate: rate_id,
        label_file_type: "PDF",
        async: false,
      });

      if (txn?.status !== "SUCCESS") {
        const msg = Array.isArray(txn?.messages) && txn.messages[0]?.text
          ? txn.messages[0].text
          : "Label purchase failed";
        return jsonResponse({ error: msg }, 400);
      }

      const labelUrl = txn.label_url;
      const trackingNumber = txn.tracking_number;
      const carrier = txn.rate?.provider || "";

      await admin.from("orders").update({
        tracking_number: trackingNumber,
        carrier,
        label_url: labelUrl,
        shippo_transaction_id: txn.object_id,
        status: "shipped",
      }).eq("id", order_id);

      // Notify buyer via in-app notification
      try {
        const { data: full } = await admin.from("orders")
          .select("buyer_id, buyer_email, listing_id").eq("id", order_id).maybeSingle();
        if (full?.buyer_id) {
          await admin.from("notifications").insert({
            user_id: full.buyer_id,
            type: "order_shipped",
            title: "Your order has shipped!",
            message: `Tracking: ${trackingNumber} via ${carrier}`,
            link: `/marketplace`,
          });
        }
      } catch (e) {
        console.error("[shippo] notify buyer failed", e);
      }

      return jsonResponse({
        label_url: labelUrl,
        tracking_number: trackingNumber,
        carrier,
        transaction_id: txn.object_id,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-shippo-label] error", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
