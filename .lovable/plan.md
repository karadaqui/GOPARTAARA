

# ScaleSERP Integration Plan — "More Deals" Section

## Overview
Add ScaleSERP Google Shopping results as a separate, optional data source displayed in a "More Deals" section on the search results page. No existing search logic will be modified.

## Architecture

```text
SearchResults.tsx
├── Existing eBay results (unchanged)
├── Amazon card (unchanged)
├── NEW: "More Deals" section ← ScaleSERP results
├── Global Suppliers (unchanged)
└── Pagination (unchanged)
```

## Step 1: Add ScaleSERP API Key as a Secret
- Use `add_secret` to request `SCALESERP_API_KEY` from the user
- The key is only used server-side in the edge function

## Step 2: Create Edge Function `search-scaleserp`
**File:** `supabase/functions/search-scaleserp/index.ts`

- Accepts `{ query: string }` via POST
- Validates JWT (authenticated users only)
- Validates/sanitizes input with Zod (max 200 chars)
- Calls `https://api.scaleserp.com/search` with:
  - `api_key` from env, `search_type: "shopping"`, `q: query`, `num: 8`
- In-memory cache with 15-minute TTL (keyed by query)
- Returns simplified array:
  ```json
  [{ "title", "price", "source", "link", "image", "rating" }]
  ```
- CORS headers from shared security module
- Graceful fallback: returns empty array on any error (never breaks the page)

## Step 3: Add Feature Flag
**File:** `src/lib/featureFlags.ts` (new)

```ts
export const useScaleSERP = true;
```

Simple boolean constant. Can be toggled to `false` to disable the feature instantly without removing code.

## Step 4: Frontend — "More Deals" Section
**File:** `src/pages/SearchResults.tsx` (additions only, no existing code modified)

- Add state: `scaleSerpResults`, `scaleSerpLoading`
- Add a separate `useEffect` that fires when `activeQuery` changes AND `useScaleSERP` is `true`:
  - Check `sessionStorage` cache (key: `scaleserp:{query}`, 15-min TTL)
  - If miss, call `supabase.functions.invoke("search-scaleserp", { body: { query } })`
  - Store results in state + sessionStorage
- Render a "More Deals" card section between the "More sources coming soon" banner and the Amazon card:
  - Header: "🔥 More Deals" with a subtle "Google Shopping" badge
  - Horizontal scroll row of compact product cards (image, title, price, source, external link)
  - Skeleton loading state while fetching
  - If no results or feature disabled: section hidden entirely (no empty state)
- Each card opens the product link in a new tab

## Step 5: Deploy Edge Function
- Deploy `search-scaleserp` via the deploy tool

## What stays untouched
- `search-parts` edge function (eBay) — zero changes
- All filter logic, FilterBar, sort, pagination — zero changes
- Existing result cards, saved parts, compare — zero changes

## Technical Details
- **Caching:** 15-min in-memory cache server-side + 15-min sessionStorage client-side = no duplicate API calls
- **Security:** JWT required, input sanitized, API key server-side only
- **Performance:** Separate useEffect, independent of eBay fetch; lazy/non-blocking
- **Kill switch:** Set `useScaleSERP = false` to disable instantly

