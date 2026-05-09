## Shippo Shipping Integration

Add full shipping workflow to the marketplace using Shippo, with seller addresses, per-listing shipping fields, an orders system, and edge-function-driven label creation.

### 1. Database (single migration)

**Extend `seller_listings`:**
- `shipping_fee` numeric, nullable
- `free_shipping` boolean, default false
- `dispatch_time` text, nullable

**Extend `seller_profiles` — sender address:**
- `sender_name`, `sender_company`, `sender_street1`, `sender_street2`, `sender_city`, `sender_state`, `sender_zip`, `sender_country`, `sender_phone`

**New `orders` table:**
- `id`, `listing_id`, `seller_id`, `buyer_id`, `offer_id`
- `amount`, `shipping_fee`, `total_amount`
- `status` text default `'awaiting_shipment'`
- `buyer_name`, `buyer_email`
- `shipping_address` jsonb
- `tracking_number`, `carrier`, `label_url`, `shippo_transaction_id`
- timestamps + `update_updated_at_column` trigger

**RLS on `orders`:**
- Seller sees own (`seller_id = auth.uid()`)
- Buyer sees own (`buyer_id = auth.uid()`)
- Both can update status of their own orders
- Service role full access
- Admin full access

### 2. Edge function: `create-shippo-label`

Single function with three actions (POST body `{ action }`):
- `get_rates` — calls `POST https://api.goshippo.com/shipments/` with `address_from`, `address_to`, `parcels`. Returns rate list.
- `purchase_label` — calls `POST https://api.goshippo.com/transactions/` with `rate` id. Returns label_url + tracking_number, updates `orders` row, sends buyer notification.
- `create_order` — used by client after Stripe redirect to create the order row from offer + buyer-supplied delivery address (also pings seller notification).

JWT-validated. Uses `SHIPPO_API_KEY` from env. Validates inputs with zod-style checks. Auto-injects HS code from listing category map.

### 3. Frontend changes

**`src/lib/hsCodes.ts`** (new) — category → HS code map per spec.

**`src/lib/shippo.ts`** (new) — typed `invokeShippo(action, payload)` wrapper around `supabase.functions.invoke`.

**`src/pages/MyMarket.tsx`:**
- Listing form (create + edit): add Shipping section (fee input, free toggle disables fee, dispatch time select). Wire to new columns.
- Edit Profile modal: add Sender Address section (all 9 fields, country dropdown reuses `COUNTRIES`).
- New "Orders" tab/section: lists rows from `orders` for this seller with photo, buyer, total, status badge, and "Create Shipping Label →" button.
- `CreateShippingLabelModal` (new component, inline or `src/components/CreateShippingLabelModal.tsx`):
  - Step 1: from/to readonly + weight + L/W/H + carrier select + Brexit warning when UK→EU.
  - Step 2: rates list (calls `get_rates`).
  - Step 3: purchase + show "Download Label (PDF)" link, mark order shipped optimistically.

**`src/pages/Marketplace.tsx`** — listing card: under price show shipping line (free / £X.XX / contact seller).

**`src/pages/ListingDetail.tsx`** — show shipping fee, dispatch time, ships-to badges (already partial).

**Order creation hook on payment success:** in the existing post-checkout buyer flow (Marketplace "Your offers" pay path / success redirect), after successful Stripe payment we'll insert an `orders` row using the buyer's saved delivery address (collected at checkout success page or inferred from offer). For this iteration: when buyer returns to Marketplace with `?paid=offerId` (existing pattern) or via a new lightweight delivery-address modal before redirect, write the order. Seller notification inserted in same edge function path.

### 4. Out of scope / preserved

- Payment, commission, Stripe checkout function unchanged.
- Tyres / Search / EV Charging / affiliates untouched.
- `SHIPPO_API_KEY` only used inside the edge function.

### 5. Files touched

Created:
- `supabase/functions/create-shippo-label/index.ts`
- `src/lib/hsCodes.ts`
- `src/lib/shippo.ts`
- `src/components/CreateShippingLabelModal.tsx`
- one migration in `supabase/migrations/`

Edited:
- `src/pages/MyMarket.tsx` (listing form, profile modal, orders section)
- `src/pages/Marketplace.tsx` (card shipping line + order creation on pay)
- `src/pages/ListingDetail.tsx` (shipping detail block)
- `supabase/config.toml` (no change needed — defaults fine)

### Open question

The spec says "When a buyer pays … create an order record." The current marketplace pay flow goes via `create-marketplace-checkout`. To keep that function untouched, I'll create the order client-side after Stripe redirects back (buyer prompted for delivery address in a small modal on return). If you'd prefer the order to be created server-side inside the Stripe webhook instead, say so and I'll wire it there.
