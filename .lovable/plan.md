# Add "Awaiting buyer payment" badge for sellers

## Goal
On `/my-market`, in the "Offers Received" section, replace the generic status badge for `accepted` / `pending_payment` / `paid` offers with clearer, color-coded badges so the seller knows what's happening on the buyer's side.

## Change
Single edit in `src/pages/MyMarket.tsx` (lines 868–873), inside the `offers.map(...)` block.

Replace the current single `<Badge>` with conditional rendering:

- **`accepted` or `pending_payment`** → amber badge "Awaiting buyer payment"
- **`paid`** → emerald badge "Paid ✓"
- **`pending`** → existing secondary badge "pending"
- **`declined`** → existing destructive badge "declined"

```tsx
{offer.status === "accepted" || offer.status === "pending_payment" ? (
  <Badge className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
    Awaiting buyer payment
  </Badge>
) : offer.status === "paid" ? (
  <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
    Paid ✓
  </Badge>
) : (
  <Badge
    variant={offer.status === "pending" ? "secondary" : "destructive"}
    className="capitalize text-xs"
  >
    {offer.status}
  </Badge>
)}
```

## Notes
- Amber/emerald are status semantics (not brand red) — consistent with how warning/success states are typically expressed in the app.
- Accept/Decline buttons already only show when `status === "pending"`, so no button-visibility changes needed.
- No DB or edge function changes. Buyer-side Pay Now flow is unaffected.
