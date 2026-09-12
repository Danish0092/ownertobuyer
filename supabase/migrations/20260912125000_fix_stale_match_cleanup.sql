-- ============================================================
-- Fix: the candidate-narrowing WHERE clause in both refresh
-- functions (used to avoid scoring against the whole table) also had
-- the side effect of hiding EXISTING matches from ever being
-- reconsidered once a hard-filter column changed. Caught live:
-- flipping a matched test property's purpose from SALE to RENT left
-- its stale requirement_match row in place forever, since the
-- candidate query for that property no longer returned the
-- (now-mismatched) requirement at all, so the loop's own
-- score-dropped-below-50 cleanup never got a chance to run on it.
--
-- Fix: explicitly delete any existing match for this anchor row whose
-- pairing no longer satisfies the current candidate criteria, before
-- the loop scores whatever still does.
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

  -- Drop any existing match whose requirement no longer satisfies the
  -- current candidate criteria (e.g. property's purpose/city/type
  -- changed, or the requirement expired/paused since it last matched).
  delete from public.requirement_matches m
  using public.buyer_requirements r
  where m.property_id = p_property_id
    and m.requirement_id = r.id
    and not (
      r.status = 'ACTIVE'
      and (r.expires_at is null or r.expires_at > now())
      and r.purpose = p.purpose
      and r.city_id = p.city_id
      and (r.property_type is null or r.property_type = p.property_type)
      and (r.property_category is null or r.property_category = p.category)
    );

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

  -- Drop any existing match whose property no longer satisfies the
  -- current candidate criteria.
  delete from public.requirement_matches m
  using public.properties p
  where m.requirement_id = p_requirement_id
    and m.property_id = p.id
    and not (
      p.status = 'PUBLISHED'
      and p.purpose = r.purpose
      and p.city_id = r.city_id
      and (r.property_type is null or p.property_type = r.property_type)
      and (r.property_category is null or p.category = r.property_category)
    );

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

revoke execute on function public.refresh_matches_for_property(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_matches_for_requirement(uuid) from public, anon, authenticated;
