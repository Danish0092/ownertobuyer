-- ============================================================
-- Fix: calculate_match_score() failed at runtime with
-- "malformed array literal" the first time two real rows actually
-- matched. `reasons || 'text'` is ambiguous to Postgres when reasons
-- starts as an empty '{}' literal in this context — it tried to parse
-- the right-hand string as an array literal instead of appending it
-- as a single element. array_append() is unambiguous.
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

  if r.purpose <> p.purpose then
    return jsonb_build_object('score', 0, 'reasons', '[]'::jsonb);
  end if;

  if r.society_id is not null and r.society_id = p.society_id then
    score := score + 35;
    reasons := array_append(reasons, 'Same society');
  elsif r.area_id is not null and r.area_id = p.area_id then
    score := score + 25;
    reasons := array_append(reasons, 'Same area');
  elsif r.city_id = p.city_id then
    score := score + 10;
    reasons := array_append(reasons, 'Same city');
  end if;

  if p.price between r.min_budget and r.max_budget then
    score := score + 25;
    reasons := array_append(reasons, 'Price within buyer budget');
  elsif p.price between r.min_budget * 0.9 and r.max_budget * 1.1 then
    score := score + 15;
    reasons := array_append(reasons, 'Price close to buyer budget');
  end if;

  if r.min_size is not null and r.max_size is not null and r.size_unit is not null
     and p.size is not null and p.size_unit is not null then
    p_sqft := public.size_to_sqft(p.size, p.size_unit);
    r_min_sqft := public.size_to_sqft(r.min_size, r.size_unit);
    r_max_sqft := public.size_to_sqft(r.max_size, r.size_unit);

    if p_sqft between r_min_sqft and r_max_sqft then
      score := score + 20;
      reasons := array_append(reasons, 'Size matches');
    elsif p_sqft between r_min_sqft * 0.8 and r_max_sqft * 1.2 then
      score := score + 10;
      reasons := array_append(reasons, 'Size close to requirement');
    end if;
  end if;

  if r.property_type is not null and r.property_type = p.property_type then
    score := score + 10;
    reasons := array_append(reasons, 'Same property type');
  elsif r.property_category is not null and r.property_category = p.category then
    score := score + 5;
    reasons := array_append(reasons, 'Same property category');
  end if;

  score := score + 5;
  reasons := array_append(reasons, 'Same purpose');

  if r.payment_type = 'CASH' then
    score := score + 5;
    reasons := array_append(reasons, 'Cash buyer');
  end if;

  return jsonb_build_object('score', score, 'reasons', to_jsonb(reasons));
end;
$$;

revoke execute on function public.calculate_match_score(uuid, uuid) from public, anon, authenticated;
