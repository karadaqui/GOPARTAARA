
-- ── deletion_requests: lock down public access ─────────────────────────
DROP POLICY IF EXISTS "Public can verify deletion by token" ON public.deletion_requests;
DROP POLICY IF EXISTS "Public can confirm deletion by token" ON public.deletion_requests;

-- Safe RPC: verify a deletion token (returns minimal row data when valid)
CREATE OR REPLACE FUNCTION public.verify_deletion_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  type text,
  confirmed boolean,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, type, confirmed, expires_at, created_at
  FROM public.deletion_requests
  WHERE token = p_token
  LIMIT 1;
$$;

-- Safe RPC: confirm a deletion via its token
CREATE OR REPLACE FUNCTION public.confirm_deletion_request(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.deletion_requests
  SET confirmed = true, confirmed_at = now()
  WHERE token = p_token
    AND confirmed = false
    AND expires_at > now();
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_deletion_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_deletion_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_deletion_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_deletion_request(uuid) TO anon, authenticated;

-- ── price_history: drop the broad authenticated read policy ────────────
DROP POLICY IF EXISTS "Authenticated users can read price history" ON public.price_history;
-- Owner-scoped policy "Users can read their own price history" already exists.

-- ── Revoke EXECUTE on internal SECURITY DEFINER helpers from clients ───
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)            FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)            FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_referral(text, uuid)          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_email_confirmed(text)              FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()                 FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trim_recently_viewed()                FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                     FROM anon, authenticated, PUBLIC;
-- increment_listing_view IS called from the client; leave it executable.
