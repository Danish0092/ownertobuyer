-- ============================================================
-- Fix: properties_match_refresh's column list omitted `purpose`,
-- even though purpose is the hard filter calculate_match_score()
-- checks first. Caught live: flipping a matched test listing's
-- purpose from SALE to RENT left its now-nonsensical
-- requirement_match row in place instead of being deleted, because
-- the trigger never fired for that column.
-- ============================================================

drop trigger if exists properties_match_refresh on public.properties;
create trigger properties_match_refresh
after insert or update of status, price, city_id, area_id, society_id, size, size_unit, property_type, category, purpose
on public.properties
for each row
execute function public.trg_property_match_refresh();
