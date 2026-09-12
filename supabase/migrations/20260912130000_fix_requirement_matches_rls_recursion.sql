-- ============================================================
-- Fix: infinite recursion between buyer_requirements and
-- requirement_matches RLS policies.
--
-- buyer_requirements' SELECT policy queried requirement_matches (to
-- let a matched property's seller see the requirement) — but
-- requirement_matches itself has RLS enabled, so that subquery had to
-- evaluate requirement_matches' OWN SELECT policy, which in turn
-- queried buyer_requirements again to check the buyer's own access.
-- Postgres detected the cycle: 42P17 infinite recursion.
--
-- Caught live via a plain anonymous REST call to both tables.
--
-- Fix: move the buyer_requirements -> requirement_matches check into
-- a SECURITY DEFINER function, same pattern as is_admin(). A
-- SECURITY DEFINER function's internal queries run as its owner
-- (bypassing RLS entirely for that owner), so this specific query no
-- longer re-enters requirement_matches' policy at all — breaking the
-- cycle without weakening what either policy actually allows.
-- ============================================================

create or replace function public.is_matched_seller_for_requirement(p_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requirement_matches m
    join public.properties p on p.id = m.property_id
    where m.requirement_id = p_requirement_id
    and p.seller_id = auth.uid()
  );
$$;

drop policy if exists "Buyer requirements select: own, matched seller, or admin" on public.buyer_requirements;
create policy "Buyer requirements select: own, matched seller, or admin"
on public.buyer_requirements
for select
using (
  buyer_id = (select auth.uid())
  or (select public.is_admin())
  or (select public.is_matched_seller_for_requirement(buyer_requirements.id))
);
