-- ============================================================
-- Fix multiple-permissive-policy overlap introduced by the admin
-- setup migrations themselves:
--
-- - profiles UPDATE had "Users can update own profile" stacked on
--   the new "Admins can manage profiles" — same overlap pattern the
--   RLS performance cleanup migration fixed everywhere else.
-- - user_roles SELECT had "Admins can view roles" stacked on the new
--   "Admins can manage roles" ALL policy (which already covers
--   SELECT) — the old one is now fully redundant.
-- ============================================================

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Profiles update: own or admin"
on public.profiles
for update
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can view roles" on public.user_roles;
-- "Admins can manage roles" (for all) already covers select.
