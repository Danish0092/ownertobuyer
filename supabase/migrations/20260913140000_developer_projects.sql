-- ============================================================
-- MODULE 3 — DEVELOPER PROJECTS
--
-- A project is a genuinely new entity, not "one more property": it's
-- a container for multiple inventory unit types plus its own media,
-- which properties has no shape for. Reused wherever possible:
--   - the existing cities/areas/societies location hierarchy
--   - authority_status for the approval claim (same "seller claims,
--     not platform-verified" framing already used on properties)
--   - size_unit / property_type / media_type enums
--   - the exact ownership-based RLS shape properties already uses
--     (developer_id = auth.uid() or admin — no account_type gating,
--     consistent with the Module 1 decision that account_type drives
--     dashboards, not database-level capability checks)
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- Visibility/lifecycle of the project LISTING itself. Deliberately
-- separate from development progress below — a project is normally
-- published while still under construction, not one-or-the-other.
create type public.project_status as enum (
  'DRAFT',
  'PUBLISHED',
  'HIDDEN'
);

-- Physical construction progress, shown to buyers regardless of
-- whether the listing is currently published.
create type public.project_development_status as enum (
  'PLANNING',
  'UNDER_CONSTRUCTION',
  'PARTIALLY_COMPLETED',
  'COMPLETED',
  'ON_HOLD'
);

-- ============================================================
-- 2. PROJECTS
-- ============================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),

  developer_id uuid not null
    references public.profiles(id) on delete cascade,

  name text not null,
  slug text not null unique,
  description text,

  -- The public-facing developer/society brand name — a company or
  -- society name, which can legitimately differ from the posting
  -- account's own profile.full_name.
  developer_name text not null,

  city_id uuid not null
    references public.cities(id) on delete restrict,
  area_id uuid references public.areas(id) on delete set null,
  society_id uuid references public.societies(id) on delete set null,
  address text,

  -- Self-declared claim, same as properties.authority_status — never
  -- presented as OwnerToBuyer-verified.
  approval_status public.authority_status not null default 'NOT_PROVIDED',

  development_status public.project_development_status not null default 'PLANNING',
  status public.project_status not null default 'DRAFT',

  -- "Starting from" price range shown on the project card, ahead of
  -- (and independent from) the detailed per-unit-type inventory.
  min_price numeric(18, 2) check (min_price >= 0),
  max_price numeric(18, 2) check (max_price >= 0),

  contact_name text,
  contact_phone text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,

  check (min_price is null or max_price is null or min_price <= max_price)
);

create trigger projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create index idx_projects_developer on public.projects(developer_id);
create index idx_projects_city on public.projects(city_id);
create index idx_projects_area on public.projects(area_id);
create index idx_projects_society on public.projects(society_id);
create index idx_projects_status on public.projects(status);
create index idx_projects_created on public.projects(created_at desc);

alter table public.projects enable row level security;

create policy "Projects select: published, own, or admin"
on public.projects
for select
using (
  status = 'PUBLISHED'
  or developer_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "Projects insert: own or admin"
on public.projects
for insert
with check (developer_id = (select auth.uid()) or (select public.is_admin()));

create policy "Projects update: own or admin"
on public.projects
for update
using (developer_id = (select auth.uid()) or (select public.is_admin()))
with check (developer_id = (select auth.uid()) or (select public.is_admin()));

create policy "Projects delete: own or admin"
on public.projects
for delete
using (developer_id = (select auth.uid()) or (select public.is_admin()));

-- ============================================================
-- 3. PROJECT INVENTORY
-- Unit types within a project (e.g. "5 Marla Plot", "2 Bed
-- Apartment") — reuses property_type/size_unit rather than free text
-- so inventory stays consistent with how properties are categorized
-- elsewhere on the platform.
-- ============================================================

create table public.project_inventory (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id) on delete cascade,

  property_type public.property_type not null,
  size numeric(12, 2) check (size > 0),
  size_unit public.size_unit,

  price_min numeric(18, 2) not null check (price_min >= 0),
  price_max numeric(18, 2) check (price_max >= 0),

  total_units integer check (total_units >= 0),
  available_units integer check (available_units >= 0),

  payment_plan text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  check (price_max is null or price_min <= price_max),
  check (total_units is null or available_units is null or available_units <= total_units)
);

create trigger project_inventory_updated_at
before update on public.project_inventory
for each row
execute function public.set_updated_at();

create index idx_project_inventory_project on public.project_inventory(project_id);

alter table public.project_inventory enable row level security;

create policy "Project inventory select: published project, own, or admin"
on public.project_inventory
for select
using (
  exists (
    select 1 from public.projects p
    where p.id = project_inventory.project_id
    and (p.status = 'PUBLISHED' or p.developer_id = (select auth.uid()))
  )
  or (select public.is_admin())
);

create policy "Project inventory insert: own project or admin"
on public.project_inventory
for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_inventory.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Project inventory update: own project or admin"
on public.project_inventory
for update
using (
  exists (
    select 1 from public.projects p
    where p.id = project_inventory.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_inventory.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Project inventory delete: own project or admin"
on public.project_inventory
for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = project_inventory.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

-- ============================================================
-- 4. PROJECT MEDIA
-- Same shape as property_media, separate table because it hangs off
-- projects rather than properties.
-- ============================================================

create table public.project_media (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id) on delete cascade,

  media_type public.media_type not null,
  storage_path text not null,
  thumbnail_path text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,

  created_at timestamptz not null default timezone('utc', now())
);

create index idx_project_media_project on public.project_media(project_id, sort_order);

alter table public.project_media enable row level security;

create policy "Project media select: published project, own, or admin"
on public.project_media
for select
using (
  exists (
    select 1 from public.projects p
    where p.id = project_media.project_id
    and (p.status = 'PUBLISHED' or p.developer_id = (select auth.uid()))
  )
  or (select public.is_admin())
);

create policy "Project media insert: own project or admin"
on public.project_media
for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_media.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Project media update: own project or admin"
on public.project_media
for update
using (
  exists (
    select 1 from public.projects p
    where p.id = project_media.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_media.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Project media delete: own project or admin"
on public.project_media
for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = project_media.project_id
    and p.developer_id = (select auth.uid())
  )
  or (select public.is_admin())
);

-- ============================================================
-- 5. STORAGE — project-media bucket
-- Separate bucket from property-media (not reusing it) so its
-- storage.objects policies can key off projects instead of properties
-- without a combined, harder-to-audit policy checking both tables.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

create policy "Project media storage select: published, own, or admin"
on storage.objects
for select
using (
  bucket_id = 'project-media'
  and (
    exists (
      select 1 from public.projects p
      where p.id = (storage.foldername(objects.name))[1]::uuid
      and (p.status = 'PUBLISHED' or p.developer_id = (select auth.uid()))
    )
    or (select public.is_admin())
  )
);

create policy "Project media storage insert: own or admin"
on storage.objects
for insert
with check (
  bucket_id = 'project-media'
  and (
    exists (
      select 1 from public.projects p
      where p.id = (storage.foldername(objects.name))[1]::uuid
      and p.developer_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);

create policy "Project media storage update: own or admin"
on storage.objects
for update
using (
  bucket_id = 'project-media'
  and (
    exists (
      select 1 from public.projects p
      where p.id = (storage.foldername(objects.name))[1]::uuid
      and p.developer_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
)
with check (
  bucket_id = 'project-media'
  and (
    exists (
      select 1 from public.projects p
      where p.id = (storage.foldername(objects.name))[1]::uuid
      and p.developer_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);

create policy "Project media storage delete: own or admin"
on storage.objects
for delete
using (
  bucket_id = 'project-media'
  and (
    exists (
      select 1 from public.projects p
      where p.id = (storage.foldername(objects.name))[1]::uuid
      and p.developer_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);
