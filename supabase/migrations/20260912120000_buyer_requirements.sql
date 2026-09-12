-- ============================================================
-- BUYER REQUIREMENTS
--
-- The demand-side mirror of public.properties. A buyer requirement
-- reuses every enum properties already has wherever the concept is
-- shared (purpose, category, property_type, size_unit) instead of
-- inventing parallel ones, so the matching engine (next migration)
-- can compare them directly.
-- ============================================================

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================

-- Not a duplicate of property_status: a requirement's lifecycle is
-- the buyer's own demand listing, not a property's publication state.
create type public.requirement_status as enum (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'FULFILLED',
  'EXPIRED',
  'CANCELLED'
);

-- properties only has installment_available (a seller flag) — a
-- buyer's payment preference has no existing home in the schema.
create type public.payment_type as enum (
  'CASH',
  'INSTALLMENTS',
  'BANK_FINANCING',
  'ANY'
);

-- ============================================================
-- 2. BUYER_REQUIREMENTS
-- ============================================================

create table public.buyer_requirements (
  id uuid primary key default gen_random_uuid(),

  buyer_id uuid not null
    references public.profiles(id) on delete cascade,

  title text not null,
  description text,

  -- Reused as-is from properties: SALE = "I want to buy",
  -- RENT = "I want to rent". Not a new concept.
  purpose public.property_purpose not null,

  property_category public.property_category,
  property_type public.property_type,

  city_id uuid not null
    references public.cities(id) on delete restrict,

  area_id uuid references public.areas(id) on delete set null,
  society_id uuid references public.societies(id) on delete set null,

  min_size numeric(12, 2) check (min_size > 0),
  max_size numeric(12, 2) check (max_size > 0),
  size_unit public.size_unit,

  min_budget numeric(18, 2) not null check (min_budget >= 0),
  max_budget numeric(18, 2) not null check (max_budget >= min_budget),

  payment_type public.payment_type not null default 'ANY',

  -- Deliberately a boolean, not property_status/possession_status:
  -- those describe a property's own construction/possession lifecycle,
  -- a buyer's ask here is simply "need it immediately or can wait".
  possession_required boolean not null default false,

  bedrooms_min integer check (bedrooms_min >= 0),
  bathrooms_min integer check (bathrooms_min >= 0),

  furnished_status public.furnished_status,

  status public.requirement_status not null default 'DRAFT',

  expires_at timestamptz,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  check (min_size is null or max_size is null or min_size <= max_size)
);

create trigger buyer_requirements_updated_at
before update on public.buyer_requirements
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. INDEXES
-- Mirrors idx_properties_search so both sides of the matching
-- query hit an index on the same shape of filter.
-- ============================================================

create index idx_buyer_requirements_buyer
on public.buyer_requirements(buyer_id);

create index idx_buyer_requirements_city
on public.buyer_requirements(city_id);

create index idx_buyer_requirements_area
on public.buyer_requirements(area_id);

create index idx_buyer_requirements_society
on public.buyer_requirements(society_id);

create index idx_buyer_requirements_status
on public.buyer_requirements(status);

create index idx_buyer_requirements_expires
on public.buyer_requirements(expires_at);

create index idx_buyer_requirements_budget
on public.buyer_requirements(min_budget, max_budget);

create index idx_buyer_requirements_size
on public.buyer_requirements(min_size, max_size);

create index idx_buyer_requirements_search
on public.buyer_requirements(
  status,
  city_id,
  purpose,
  property_type
);

-- ============================================================
-- 4. RLS
-- A requirement is private to its buyer and admins for now. The next
-- migration (matching engine) extends SELECT to also cover a matched
-- property's seller once public.requirement_matches exists — kept
-- separate here since that table doesn't exist yet in this file.
-- Not publicly browsable — the future Buyer Demand Map (V2) reads
-- aggregated counts, never raw rows, so this stays tight without
-- blocking that feature.
-- ============================================================

alter table public.buyer_requirements enable row level security;

create policy "Buyer requirements select: own or admin"
on public.buyer_requirements
for select
using (
  buyer_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "Buyer requirements insert: own"
on public.buyer_requirements
for insert
with check (buyer_id = (select auth.uid()));

create policy "Buyer requirements update: own or admin"
on public.buyer_requirements
for update
using (buyer_id = (select auth.uid()) or (select public.is_admin()))
with check (buyer_id = (select auth.uid()) or (select public.is_admin()));

create policy "Buyer requirements delete: own or admin"
on public.buyer_requirements
for delete
using (buyer_id = (select auth.uid()) or (select public.is_admin()));
