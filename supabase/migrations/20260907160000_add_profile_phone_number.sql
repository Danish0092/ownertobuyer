-- ============================================================
-- Add phone_number to profiles
--
-- Needed for the PropertyDetail Call/WhatsApp buttons — buyers need
-- a way to actually reach the seller, and nothing currently stores a
-- contactable number (auth.users.phone is Supabase Auth's own field,
-- not exposed through public APIs, and profiles never captured one).
--
-- Nullable and not yet settable through any UI — there is no profile
-- edit page yet. The property detail page must handle a null phone
-- gracefully (disable Call/WhatsApp) until that exists.
--
-- Already covered by the existing "Public can view active profiles"
-- policy (select using is_active and not is_blocked) — no RLS change
-- needed. This is intentional: sellers post properties specifically
-- to be contacted by buyers, so a phone number here is expected to be
-- shared, the same way other property portals show a seller's number
-- on their listings.
-- ============================================================

alter table public.profiles
add column if not exists phone_number text;
