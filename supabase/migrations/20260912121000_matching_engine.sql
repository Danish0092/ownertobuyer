-- ============================================================
-- MATCHING ENGINE
--
-- Hybrid architecture: matches are computed synchronously and
-- persisted (not a background job, not recomputed on every page
-- view). Two trigger points:
--   1. A property is inserted/edited -> rescan active requirements.
--   2. A requirement is inserted/edited -> rescan published properties.
-- Both call the same deterministic scoring function. Rows scoring
-- >= 50 are kept in requirement_matches; a notification fires only
-- the first time a pair crosses that threshold, not on every re-scan.
-- ============================================================

-- ============================================================
-- 1. REQUIREMENT_MATCHES
-- ============================================================

create table public.requirement_matches (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.buyer_requirements(id) on delete cascade,

  property_id uuid not null
    references public.properties(id) on delete cascade,

  score integer not null check (score >= 0 and score <= 100),

  -- Explainable, deterministic reasons (e.g. "Same society",
  -- "Price within buyer budget") — never a black-box AI score.
  reasons jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  unique (requirement_id, property_id)
);

create index idx_requirement_matches_requirement
on public.requirement_matches(requirement_id, score desc);

create index idx_requirement_matches_property
on public.requirement_matches(property_id, score desc);

alter table public.requirement_matches enable row level security;

-- No insert/update/delete policy for any client role: rows are only
-- ever written by the SECURITY DEFINER functions below, which bypass
-- RLS as the function owner — matching the project's existing pattern
-- for system-managed tables (e.g. notifications has no user INSERT
-- policy either).
create policy "Requirement matches select: buyer, seller, or admin"
on public.requirement_matches
for select
using (
  (select public.is_admin())
  or exists (
    select 1 from public.buyer_requirements r
    where r.id = requirement_matches.requirement_id
    and r.buyer_id = (select auth.uid())
  )
  or exists (
    select 1 from public.properties p
    where p.id = requirement_matches.property_id
    and p.seller_id = (select auth.uid())
  )
);

-- Now that requirement_matches exists, extend buyer_requirements
-- SELECT so a matched property's seller can see what the buyer is
-- asking for (deferred from the previous migration for ordering).
drop policy if exists "Buyer requirements select: own or admin" on public.buyer_requirements;
create policy "Buyer requirements select: own, matched seller, or admin"
on public.buyer_requirements
for select
using (
  buyer_id = (select auth.uid())
  or (select public.is_admin())
  or exists (
    select 1
    from public.requirement_matches m
    join public.properties p on p.id = m.property_id
    where m.requirement_id = buyer_requirements.id
    and p.seller_id = (select auth.uid())
  )
);

-- ============================================================
-- 2. SIZE NORMALIZATION
-- Buyers and listings can each use a different size_unit; everything
-- is compared in square feet. Figures match common Lahore real-estate
-- convention: 1 Kanal = 20 Marla = 4500 Sq Ft.
-- ============================================================

create or replace function public.size_to_sqft(value numeric, unit public.size_unit)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case unit
    when 'MARLA' then value * 225
    when 'KANAL' then value * 4500
    when 'SQ_YD' then value * 9
    when 'SQ_M' then value * 10.7639
    when 'ACRES' then value * 43560
    when 'SQ_FT' then value
    else null
  end;
$$;

-- ============================================================
-- 3. MATCH SCORE
-- Deterministic and explainable — every point awarded has a plain-
-- language reason attached. Purpose is a hard prerequisite (a RENT
-- listing can never match a BUY requirement, regardless of how well
-- everything else lines up) rather than a partial-credit dimension;
-- its 5 points are awarded flat once a pair has survived that filter,
-- so the weights still sum to 100 without contradicting that logic.
-- Weights: Location 35, Budget 25, Size 20, Type 10, Purpose 5, Cash 5.
-- ============================================================

create or replace function public.calculate_match_score(p_requirement_id uuid, p_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.buyer_requirements%rowtype;
  p public.properties%rowtype;
  score integer := 0;
  reasons text[] := '{}';
  p_sqft numeric;
  r_min_sqft numeric;
  r_max_sqft numeric;
begin
  select * into r from public.buyer_requirements where id = p_requirement_id;
  select * into p from public.properties where id = p_property_id;

  if r.id is null or p.id is null then
    return jsonb_build_object('score', 0, 'reasons', '[]'::jsonb);
  end if;

  -- Hard filter: renting and buying are not "close enough".
  if r.purpose <> p.purpose then
    return jsonb_build_object('score', 0, 'reasons', '[]'::jsonb);
  end if;

  -- Location (35)
  if r.society_id is not null and r.society_id = p.society_id then
    score := score + 35;
    reasons := reasons || 'Same society';
  elsif r.area_id is not null and r.area_id = p.area_id then
    score := score + 25;
    reasons := reasons || 'Same area';
  elsif r.city_id = p.city_id then
    score := score + 10;
    reasons := reasons || 'Same city';
  end if;

  -- Budget (25)
  if p.price between r.min_budget and r.max_budget then
    score := score + 25;
    reasons := reasons || 'Price within buyer budget';
  elsif p.price between r.min_budget * 0.9 and r.max_budget * 1.1 then
    score := score + 15;
    reasons := reasons || 'Price close to buyer budget';
  end if;

  -- Size (20) — only scored when both sides actually specified one.
  if r.min_size is not null and r.max_size is not null and r.size_unit is not null
     and p.size is not null and p.size_unit is not null then
    p_sqft := public.size_to_sqft(p.size, p.size_unit);
    r_min_sqft := public.size_to_sqft(r.min_size, r.size_unit);
    r_max_sqft := public.size_to_sqft(r.max_size, r.size_unit);

    if p_sqft between r_min_sqft and r_max_sqft then
      score := score + 20;
      reasons := reasons || 'Size matches';
    elsif p_sqft between r_min_sqft * 0.8 and r_max_sqft * 1.2 then
      score := score + 10;
      reasons := reasons || 'Size close to requirement';
    end if;
  end if;

  -- Property type (10)
  if r.property_type is not null and r.property_type = p.property_type then
    score := score + 10;
    reasons := reasons || 'Same property type';
  elsif r.property_category is not null and r.property_category = p.category then
    score := score + 5;
    reasons := reasons || 'Same property category';
  end if;

  -- Purpose (5) — flat, since it already passed the hard filter above.
  score := score + 5;
  reasons := reasons || 'Same purpose';

  -- Other (5): cash buyer
  if r.payment_type = 'CASH' then
    score := score + 5;
    reasons := reasons || 'Cash buyer';
  end if;

  return jsonb_build_object('score', score, 'reasons', to_jsonb(reasons));
end;
$$;

-- ============================================================
-- 4. REFRESH FUNCTIONS
-- Each is anchored on one side and rescans the other. Both share the
-- same persist threshold (>= 50) and the same "only notify on a newly
-- crossed threshold" rule so editing a listing/requirement repeatedly
-- doesn't spam duplicate notifications.
-- ============================================================

create or replace function public.refresh_matches_for_property(p_property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.properties%rowtype;
  candidate record;
  result jsonb;
  new_score integer;
  existing_score integer;
begin
  select * into p from public.properties where id = p_property_id;
  if p.id is null then
    return;
  end if;

  if p.status <> 'PUBLISHED' then
    delete from public.requirement_matches where property_id = p_property_id;
    return;
  end if;

  for candidate in
    select r.id, r.buyer_id
    from public.buyer_requirements r
    where r.status = 'ACTIVE'
      and (r.expires_at is null or r.expires_at > now())
      and r.purpose = p.purpose
      and r.city_id = p.city_id
      and (r.property_type is null or r.property_type = p.property_type)
      and (r.property_category is null or r.property_category = p.category)
  loop
    result := public.calculate_match_score(candidate.id, p_property_id);
    new_score := (result->>'score')::integer;

    select score into existing_score
    from public.requirement_matches
    where requirement_id = candidate.id and property_id = p_property_id;

    if new_score >= 50 then
      insert into public.requirement_matches (requirement_id, property_id, score, reasons)
      values (candidate.id, p_property_id, new_score, result->'reasons')
      on conflict (requirement_id, property_id)
      do update set score = excluded.score, reasons = excluded.reasons, updated_at = timezone('utc', now());

      if existing_score is null or existing_score < 50 then
        insert into public.notifications (user_id, type, title, message, reference_type, reference_id)
        values (
          p.seller_id, 'NEW_MATCH', 'Potential Buyer Found',
          new_score || '% match on "' || p.title || '"',
          'requirement_match', candidate.id
        );
        insert into public.notifications (user_id, type, title, message, reference_type, reference_id)
        values (
          candidate.buyer_id, 'NEW_MATCH', 'New Property Match',
          new_score || '% match for your requirement',
          'requirement_match', p_property_id
        );
      end if;
    elsif existing_score is not null then
      delete from public.requirement_matches
      where requirement_id = candidate.id and property_id = p_property_id;
    end if;
  end loop;
end;
$$;

create or replace function public.refresh_matches_for_requirement(p_requirement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.buyer_requirements%rowtype;
  candidate record;
  result jsonb;
  new_score integer;
  existing_score integer;
begin
  select * into r from public.buyer_requirements where id = p_requirement_id;
  if r.id is null then
    return;
  end if;

  if r.status <> 'ACTIVE' or (r.expires_at is not null and r.expires_at <= now()) then
    delete from public.requirement_matches where requirement_id = p_requirement_id;
    return;
  end if;

  for candidate in
    select p.id, p.seller_id, p.title
    from public.properties p
    where p.status = 'PUBLISHED'
      and p.purpose = r.purpose
      and p.city_id = r.city_id
      and (r.property_type is null or p.property_type = r.property_type)
      and (r.property_category is null or p.category = r.property_category)
  loop
    result := public.calculate_match_score(p_requirement_id, candidate.id);
    new_score := (result->>'score')::integer;

    select score into existing_score
    from public.requirement_matches
    where requirement_id = p_requirement_id and property_id = candidate.id;

    if new_score >= 50 then
      insert into public.requirement_matches (requirement_id, property_id, score, reasons)
      values (p_requirement_id, candidate.id, new_score, result->'reasons')
      on conflict (requirement_id, property_id)
      do update set score = excluded.score, reasons = excluded.reasons, updated_at = timezone('utc', now());

      if existing_score is null or existing_score < 50 then
        insert into public.notifications (user_id, type, title, message, reference_type, reference_id)
        values (
          candidate.seller_id, 'NEW_MATCH', 'Potential Buyer Found',
          new_score || '% match on "' || candidate.title || '"',
          'requirement_match', p_requirement_id
        );
        insert into public.notifications (user_id, type, title, message, reference_type, reference_id)
        values (
          r.buyer_id, 'NEW_MATCH', 'New Property Match',
          new_score || '% match for your requirement',
          'requirement_match', candidate.id
        );
      end if;
    elsif existing_score is not null then
      delete from public.requirement_matches
      where requirement_id = p_requirement_id and property_id = candidate.id;
    end if;
  end loop;
end;
$$;

-- Internal only: revoke direct RPC access. They're invoked exclusively
-- from the trigger functions below (triggers run under the function
-- owner's privileges regardless of these grants, same reasoning as
-- handle_new_user() in the security-hardening migration).
revoke execute on function public.calculate_match_score(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.refresh_matches_for_property(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_matches_for_requirement(uuid) from public, anon, authenticated;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

create or replace function public.trg_property_match_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_matches_for_property(new.id);
  return new;
end;
$$;

create trigger properties_match_refresh
after insert or update of status, price, city_id, area_id, society_id, size, size_unit, property_type, category
on public.properties
for each row
execute function public.trg_property_match_refresh();

create or replace function public.trg_requirement_match_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_matches_for_requirement(new.id);
  return new;
end;
$$;

create trigger requirements_match_refresh
after insert or update of status, city_id, area_id, society_id, min_budget, max_budget, min_size, max_size, size_unit, property_type, property_category, purpose
on public.buyer_requirements
for each row
execute function public.trg_requirement_match_refresh();
