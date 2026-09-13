-- ============================================================
-- Add BUYER and DEVELOPER to account_type
--
-- account_type only had OWNER/DEALER. Extending it to the four
-- product-defined account types (Owner, Buyer, Realtor/Dealer,
-- Developer/Society). Additive only — existing rows and the separate
-- properties.seller_type enum (still OWNER/DEALER, a different
-- concept: who is listed as selling a given property, independent of
-- the poster's own profile account_type) are untouched.
--
-- No RLS changes: authorization on properties/buyer_requirements has
-- always been ownership-based (seller_id/buyer_id = auth.uid()), never
-- gated on account_type, and that's staying true by design — account_type
-- drives which dashboard a user sees, not what they're allowed to do at
-- the database level. See the two enums' original definitions in
-- 20260905124436_initial_schema.sql.
-- ============================================================

alter type public.account_type add value if not exists 'BUYER';
alter type public.account_type add value if not exists 'DEVELOPER';
