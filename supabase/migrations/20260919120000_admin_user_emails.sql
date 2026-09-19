-- Lets the Admin Users page show/search emails. Emails live in auth.users,
-- which the app's client can't read, so expose just (id, email) through a
-- SECURITY DEFINER function that returns rows only to admins.

create or replace function public.admin_user_emails()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text
  from auth.users u
  where (select public.is_admin());
$$;

revoke all on function public.admin_user_emails() from public, anon;
grant execute on function public.admin_user_emails() to authenticated;
