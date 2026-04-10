

## Problem

When you confirm your email on your phone, the PC's `/verify-email` page stays stuck. This happens because:
- The `storage` event listener only works between tabs in the **same browser** — it cannot detect logins on a different device
- The `visibilitychange`/`focus` listener calls `getSession()`, but the PC has **no session** (it was signed out after signup to prevent pre-verification login)
- The phone creates its own session — the PC never gets one

The PC has no way to know the email was confirmed because there is no session to detect.

## Solution

Create a backend function that checks whether an email address has been confirmed, and poll it from the `/verify-email` page every 3 seconds. Once confirmed, redirect the user to the sign-in page with a success message.

### Step 1: Create edge function `check-email-verified`

A lightweight function that accepts an email address and queries `auth.users` (using the service role key) to check if `email_confirmed_at` is set.

- Returns `{ verified: true }` or `{ verified: false }`
- Rate-limited by design (only called every 3 seconds from one page)

### Step 2: Update `/verify-email` page

Replace the current storage/visibility listeners with:
- **Poll every 3 seconds**: Call `check-email-verified` with the user's email
- **On verified**: Navigate to `/auth` and show a toast: "Email verified! Please sign in."
- **Keep existing listeners** as bonus for same-browser tab detection (instant redirect if confirmed in another tab on the same PC)
- **Fallback button**: After 60 seconds, show a "Continue to sign in" link in case polling fails

### Step 3: Keep same-browser detection

The existing `storage` event and `onAuthStateChange` listeners stay as-is for the case where the user confirms in another tab on the same computer (instant detection). The polling handles the cross-device case.

## Technical Details

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` to query `auth.users` by email
- Only returns a boolean — no sensitive data exposed
- The polling interval cleans up on unmount
- No database migration needed

