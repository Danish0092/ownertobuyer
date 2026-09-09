-- ============================================================
-- ADMIN SETUP
--
-- Two RLS gaps the original schema left open, both needed for the
-- Admin dashboard to actually work:
--
-- 1. profiles had no admin-management policy at all — admins could
--    not update any profile but their own, so "Suspend user"
--    (setting is_blocked) would silently fail under RLS.
-- 2. user_roles had no INSERT/DELETE policy — intentional, to
--    prevent privilege escalation via the public API (nobody could
--    grant themselves a role). Now that there's a first admin,
--    existing admins can manage roles; the very first admin still
--    has to be granted via direct database access, same as we're
--    doing below.
-- ============================================================

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- First admin. Bootstrapping problem: user_roles has no INSERT policy
-- for non-admins (by design), so this can only be done via direct
-- database access — which is what this migration is.
insert into public.user_roles (user_id, role)
select id, 'ADMIN'
from auth.users
where email = 'danish.saleem0092@gmail.com'
on conflict (user_id) do update set role = 'ADMIN';
