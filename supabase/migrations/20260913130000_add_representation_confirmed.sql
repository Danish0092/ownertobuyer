-- ============================================================
-- Realtor/Dealer represented-property authorization claim
--
-- A Realtor is not the owner just because they posted the listing.
-- properties.seller_id (who manages it) and seller_type (OWNER/DEALER,
-- already independent per-listing, not derived from the poster's own
-- profile) already model that distinction fully — no new relationship
-- table is needed for a 1:1 "one manager per listing" model.
--
-- What's missing is a record of the one new claim this module
-- introduces: a Dealer/Realtor confirming, at listing time, that they
-- are authorized to market this property. Mirrors the existing
-- authority_status pattern — a self-declared claim, never presented as
-- platform-verified.
-- ============================================================

alter table public.properties
add column if not exists representation_confirmed boolean not null default false;
