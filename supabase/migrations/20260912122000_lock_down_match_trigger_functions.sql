-- ============================================================
-- The matching engine migration revoked direct RPC access on
-- calculate_match_score/refresh_matches_for_* but missed the two
-- trigger wrapper functions themselves, which Postgres grants PUBLIC
-- EXECUTE on by default at creation time (same class of oversight
-- handle_new_user() had before the original security-hardening pass).
-- They only need to run as trigger callbacks, never as a direct RPC.
-- ============================================================

revoke execute on function public.trg_property_match_refresh() from public, anon, authenticated;
revoke execute on function public.trg_requirement_match_refresh() from public, anon, authenticated;
