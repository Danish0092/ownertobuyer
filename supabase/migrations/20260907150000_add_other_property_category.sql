-- ============================================================
-- Add OTHER to property_category
--
-- The category enum only had RESIDENTIAL/COMMERCIAL/AGRICULTURAL,
-- but property_type already includes a catch-all OTHER value with
-- no category to sit under. Additive change only — existing values
-- and all existing rows are untouched.
-- ============================================================

alter type public.property_category add value if not exists 'OTHER';
