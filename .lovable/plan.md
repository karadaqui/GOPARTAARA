## Marketplace Address System & Collection at Store

Large multi-area feature. I'll implement in this order:

### 1. Database (one migration)
New table `user_addresses` (user_id, label, full_name, phone, street1, street2, city, county, postcode, country, is_default, is_billing, delivery_instructions, timestamps) with RLS (owner-only).

Add columns to `seller_profiles`:
- `offers_collection bool default false`
- `collection_address jsonb`
- `collection_instructions text`
- `collection_window text`

Add columns to `orders`:
- `order_number text` (e.g. `GP-XXXXXX`, generated client/server-side on insert)
- `fulfillment_method text default 'delivery'` (`delivery` | `collection`)
- `is_new_account bool default false`
- `collected_at timestamptz`
- `billing_address jsonb`
- `delivery_instructions text`

### 2. Shared utilities (`src/lib/`)
- `addressLookup.ts` — `lookupUKPostcode(postcode)` (postcodes.io) + `searchPhoton(query)` (photon.komoot.io). Debounced helpers + result normalizer.
- `addressValidation.ts` — UK postcode regex, phone validators (UK + international 7–15 digits).
- `orderNumber.ts` — `generateOrderNumber()` returning `GP-XXXXXX`.

### 3. Reusable components (`src/components/`)
- `PostcodeLookup.tsx` — input + dropdown of suggestions; on select fires `onSelect({street1, city, county, postcode, country})`. Shows "Address verified ✓" badge after autofill.
- `AddressForm.tsx` — full address form (name, phone, street1/2, city, county, postcode, country, delivery_instructions) with `PostcodeLookup` integrated and inline validation.
- `SavedAddressPicker.tsx` — list of saved address radio cards + "Use a different address" toggle that swaps to `AddressForm`.

### 4. Address Book in Dashboard
New section on `Dashboard.tsx` (or a new `AddressBookSection.tsx` under `src/components/dashboard/`):
- Lists `user_addresses` cards with label badge, name, address, phone, default badge.
- Buttons: Edit / Delete / Set as Default / Set as Billing.
- "+ Add New Address" button (disabled at 5).

### 5. Checkout flow rewrite
Update `DeliveryAddressModal.tsx` into a 3-step modal:
- **Step 1:** if saved addresses exist → `SavedAddressPicker`. Else → `AddressForm`.
- **Step 2:** new address form (with "Save to my account" + "Different billing address" toggle).
- **Step 3:** order summary with Delivery vs Collection toggle (only if seller `offers_collection`), final "Proceed to Payment".

When user opts to save, insert into `user_addresses` (respect 5 cap). Always pass full address through to checkout so the order row stores it. Remove existing localStorage usage.

### 6. Collection at Store (seller)
In `MyMarket.tsx` Edit Profile section, add "Collection" block:
- Toggle `offers_collection`
- Address (with `PostcodeLookup`)
- Instructions text
- Window dropdown

Persist to `seller_profiles`.

### 7. Order creation + emails
Update `create-marketplace-checkout` edge function:
- Accept `delivery_address`, `billing_address`, `fulfillment_method`, `delivery_instructions` from client.
- Compute `is_new_account` (user created < 7 days).
- Store all on the offer/order metadata; pass billing address to Stripe (AVS).

Update `stripe-webhook`:
- On payment success, insert into `orders` with `order_number = GP-XXXXXX`, `shipping_address`, `billing_address`, `fulfillment_method`, `is_new_account`, `delivery_instructions`.
- Send buyer + seller emails via existing `send-transactional-email`.
- Insert in-app notifications for both.

### 8. Collection confirmation
In MyMarket Orders:
- For `fulfillment_method = 'collection'` orders, show "Awaiting Collection" yellow badge + "Mark as Collected ✓" button (instead of shipping label flow).
- On click → update `status='collected'`, `collected_at=now()`, send buyer email.
- (7-day reminder = a small note for now; cron not in scope unless trivial.)

### 9. Fraud notes
- Inline phone & postcode validators in `AddressForm`.
- Edge function blocks orders > £200 for accounts < 7 days old (returns 400 with friendly message).
- Seller order card shows "New account" badge when `is_new_account`.

### Out of scope / preserved
- No changes to Tyres, Search, EV Charging, affiliate links.
- No changes to `src/integrations/supabase/client.ts` or `types.ts`.

### Risks / notes
- Photon and postcodes.io are called directly from the browser (both are public, CORS-enabled, no key) — fine.
- The 7-day reminder cron is deferred unless you want it now (mention in final summary).

If approved, I'll execute in this order: migration → libs/components → Dashboard address book → checkout modal rewrite → seller collection UI → edge function + webhook + emails → orders UI for collection.
