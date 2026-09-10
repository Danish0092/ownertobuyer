-- ============================================================
-- Make "Block user" actually block, not just hide their identity.
--
-- Until now, is_blocked only affected the profiles SELECT policy —
-- a blocked seller's listings stayed fully PUBLISHED and public, and
-- nothing stopped the blocked user from continuing to use their
-- account (post/edit listings, use the dashboard, etc). Confirmed
-- live: a test listing from a blocked test user still showed up on
-- the site.
--
-- This migration adds the DB-level half of the fix:
--   1. A blocked seller's PUBLISHED listings are no longer publicly
--      visible (reuses the profiles SELECT policy via an EXISTS check
--      instead of duplicating the is_blocked/is_active condition —
--      a blocked or deactivated profile is already invisible to
--      everyone but the owner and admins).
--   2. A blocked user can no longer create or update their own
--      properties (admins still can, e.g. to un-hide something).
--
-- The other half — signing a blocked user out and rejecting new
-- logins — is enforced in application code (proxy.ts, login actions)
-- since there's no session to revoke at the SQL level.
-- ============================================================

create or replace function public.current_user_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_blocked from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.current_user_blocked() from public;
grant execute on function public.current_user_blocked() to authenticated;

drop policy if exists "Properties select: published, own, or admin" on public.properties;
create policy "Properties select: published, own, or admin"
on public.properties
for select
using (
  (
    status = 'PUBLISHED'
    and exists (select 1 from public.profiles pr where pr.id = properties.seller_id)
  )
  or seller_id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "Properties insert: own or admin" on public.properties;
create policy "Properties insert: own or admin"
on public.properties
for insert
with check (
  (seller_id = (select auth.uid()) and not (select public.current_user_blocked()))
  or (select public.is_admin())
);

drop policy if exists "Properties update: own or admin" on public.properties;
create policy "Properties update: own or admin"
on public.properties
for update
using (seller_id = (select auth.uid()) or (select public.is_admin()))
with check (
  (seller_id = (select auth.uid()) and not (select public.current_user_blocked()))
  or (select public.is_admin())
);
