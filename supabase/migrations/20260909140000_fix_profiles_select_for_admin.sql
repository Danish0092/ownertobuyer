-- ============================================================
-- Fix: blocked profiles were invisible to everyone, including admins
--
-- "Public can view active profiles" only allowed
-- (is_active = true and is_blocked = false) — so the moment an admin
-- blocked a user, that row satisfied no SELECT policy at all, not
-- even for the admin who just blocked them or the user themself.
-- This also broke the block/suspend UPDATE itself: Postgres checks
-- SELECT visibility when returning the updated row, so the write was
-- rejected with "new row violates row-level security policy" even
-- though the UPDATE's own WITH CHECK passed.
-- ============================================================

drop policy if exists "Public can view active profiles" on public.profiles;
create policy "Profiles select: active, own, or admin"
on public.profiles
for select
using (
  (is_active = true and is_blocked = false)
  or id = (select auth.uid())
  or (select public.is_admin())
);
