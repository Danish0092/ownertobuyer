-- ============================================================
-- SECURITY HARDENING
-- Addresses Supabase database-linter warnings from the initial
-- schema push:
--   - function_search_path_mutable (set_updated_at)
--   - anon/authenticated_security_definer_function_executable
--     (handle_new_user)
--
-- NOT addressed here, intentionally:
--   - is_admin() is still callable by anon/authenticated. It is
--     referenced directly inside RLS policy USING clauses for
--     several tables (properties, property_media, identity_
--     verifications, property_reports, user_roles). Revoking
--     EXECUTE from those roles would break RLS evaluation for
--     every non-admin user. The function takes no parameters
--     and only reports whether the calling user (auth.uid())
--     is an admin, so leaving it publicly callable does not
--     leak any data.
-- ============================================================

-- Pin search_path on the updated_at trigger function so it
-- cannot be hijacked by a role-local search_path change.
alter function public.set_updated_at()
set search_path = public;

-- handle_new_user() only ever runs inside the
-- on_auth_user_created trigger on auth.users, where it reads
-- the trigger's NEW record. It has no legitimate use as a
-- directly-callable RPC endpoint (calling it outside trigger
-- context would fail anyway, since NEW is undefined there).
-- Revoking EXECUTE here does not affect the trigger itself:
-- triggers run using the privileges of the function's owner,
-- not the invoking role's EXECUTE grant.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
