-- ============================================================
-- GHARSEEDHA
-- Property Marketplace MVP
-- Supabase / PostgreSQL Migration
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- 2. ENUMS
-- ============================================================

create type public.account_type as enum (
  'OWNER',
  'DEALER'
);

create type public.admin_role as enum (
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN'
);

create type public.property_purpose as enum (
  'SALE',
  'RENT'
);

create type public.property_category as enum (
  'RESIDENTIAL',
  'COMMERCIAL',
  'AGRICULTURAL'
);

create type public.property_type as enum (
  'HOUSE',
  'PLOT',
  'APARTMENT',
  'FARM_HOUSE',
  'SHOP',
  'OFFICE',
  'BUILDING',
  'FACTORY',
  'WAREHOUSE',
  'AGRICULTURAL_LAND',
  'OTHER'
);

create type public.seller_type as enum (
  'OWNER',
  'DEALER'
);

create type public.property_status as enum (
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'HIDDEN',
  'SOLD',
  'RENTED',
  'REJECTED',
  'DELETED',
  'EXPIRED'
);

create type public.media_type as enum (
  'IMAGE',
  'VIDEO'
);

create type public.size_unit as enum (
  'MARLA',
  'KANAL',
  'SQ_FT',
  'SQ_YD',
  'SQ_M'
);

create type public.price_type as enum (
  'TOTAL',
  'PER_MONTH'
);

create type public.possession_status as enum (
  'AVAILABLE',
  'POSSESSION_AVAILABLE',
  'POSSESSION_PENDING',
  'UNDER_CONSTRUCTION',
  'NOT_APPLICABLE',
  'NOT_SPECIFIED'
);

create type public.furnished_status as enum (
  'FURNISHED',
  'SEMI_FURNISHED',
  'UNFURNISHED',
  'NOT_APPLICABLE',
  'NOT_SPECIFIED'
);

create type public.construction_status as enum (
  'READY',
  'UNDER_CONSTRUCTION',
  'PLOT',
  'NOT_APPLICABLE',
  'NOT_SPECIFIED'
);

create type public.authority_status as enum (
  'SELLER_CLAIMS_APPROVED',
  'SELLER_CLAIMS_NOC',
  'SELLER_CLAIMS_AUTHORITY_APPROVAL',
  'NOT_PROVIDED',
  'NOT_SURE',
  'OTHER'
);

create type public.report_reason as enum (
  'FAKE_PROPERTY',
  'MISLEADING_INFORMATION',
  'WRONG_PRICE',
  'DUPLICATE',
  'SOLD_RENTED',
  'SPAM',
  'INAPPROPRIATE',
  'FRAUD_CONCERN',
  'OTHER'
);

create type public.report_status as enum (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'DISMISSED'
);

create type public.contact_type as enum (
  'WHATSAPP',
  'CALL',
  'CHAT'
);

create type public.identity_status as enum (
  'PENDING',
  'SUBMITTED',
  'VERIFIED',
  'REJECTED'
);

create type public.notification_type as enum (
  'NEW_MESSAGE',
  'PROPERTY_APPROVED',
  'PROPERTY_REJECTED',
  'PROPERTY_REPORTED',
  'NEW_MATCH',
  'ACCOUNT_WARNING',
  'SYSTEM'
);


-- ============================================================
-- 3. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


-- ============================================================
-- 4. LOCATION TABLES
-- ============================================================

create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete restrict,
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),

  unique (province_id, slug)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),

  unique (city_id, slug)
);

create table public.societies (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),

  unique (city_id, slug)
);


-- ============================================================
-- 5. PROFILES
-- Linked 1:1 with Supabase auth.users
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,
  profile_photo text,

  account_type public.account_type not null default 'OWNER',

  phone_verified boolean not null default false,

  city_id uuid references public.cities(id) on delete set null,

  bio text,

  is_active boolean not null default true,
  is_blocked boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 6. ADMIN ROLES
-- ============================================================

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null,
  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 7. IDENTITY / CNIC
-- IMPORTANT:
-- Store encrypted value if CNIC is actually required.
-- Never expose this table publicly.
-- ============================================================

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id) on delete cascade,

  identity_type text not null default 'CNIC',

  identity_value_encrypted text,

  status public.identity_status not null default 'PENDING',

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 8. PROPERTIES
-- ============================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),

  seller_id uuid not null
    references public.profiles(id) on delete cascade,

  title text not null,
  slug text not null unique,

  purpose public.property_purpose not null,

  category public.property_category not null,

  property_type public.property_type not null,

  city_id uuid not null
    references public.cities(id) on delete restrict,

  area_id uuid
    references public.areas(id) on delete set null,

  society_id uuid
    references public.societies(id) on delete set null,

  address text,

  latitude double precision,
  longitude double precision,

  price numeric(18, 2) not null check (price >= 0),

  price_type public.price_type not null default 'TOTAL',

  size numeric(12, 2) check (size > 0),

  size_unit public.size_unit,

  bedrooms integer check (bedrooms >= 0),
  bathrooms integer check (bathrooms >= 0),

  parking_spaces integer check (parking_spaces >= 0),

  floor_number integer,
  total_floors integer,

  possession_status public.possession_status
    not null default 'NOT_SPECIFIED',

  installment_available boolean not null default false,

  furnished_status public.furnished_status
    not null default 'NOT_SPECIFIED',

  construction_status public.construction_status
    not null default 'NOT_SPECIFIED',

  authority_status public.authority_status
    not null default 'NOT_PROVIDED',

  description text,

  seller_type public.seller_type not null,

  status public.property_status not null default 'DRAFT',

  views_count bigint not null default 0 check (views_count >= 0),

  contact_count bigint not null default 0 check (contact_count >= 0),

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  published_at timestamptz,
  expires_at timestamptz
);


-- ============================================================
-- 9. PROPERTY MEDIA
-- ============================================================

create table public.property_media (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id) on delete cascade,

  media_type public.media_type not null,

  storage_path text not null,

  thumbnail_path text,

  sort_order integer not null default 0,

  is_primary boolean not null default false,

  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 10. AMENITIES
-- ============================================================

create table public.amenities (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  category text,

  created_at timestamptz not null default timezone('utc', now())
);

create table public.property_amenities (
  property_id uuid not null
    references public.properties(id) on delete cascade,

  amenity_id uuid not null
    references public.amenities(id) on delete cascade,

  primary key (property_id, amenity_id)
);


-- ============================================================
-- 11. FAVORITES
-- ============================================================

create table public.favorites (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  property_id uuid not null
    references public.properties(id) on delete cascade,

  created_at timestamptz not null default timezone('utc', now()),

  unique (user_id, property_id)
);


-- ============================================================
-- 12. SAVED SEARCHES
-- ============================================================

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  name text not null,

  purpose public.property_purpose,

  city_id uuid references public.cities(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  society_id uuid references public.societies(id) on delete set null,

  property_type public.property_type,

  min_price numeric(18, 2),
  max_price numeric(18, 2),

  min_size numeric(12, 2),
  max_size numeric(12, 2),

  size_unit public.size_unit,

  seller_type public.seller_type,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 13. PROPERTY VIEWS
-- ============================================================

create table public.property_views (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id) on delete cascade,

  user_id uuid
    references auth.users(id) on delete set null,

  session_id text,

  ip_hash text,

  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 14. PROPERTY CONTACTS
-- ============================================================

create table public.property_contacts (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id) on delete cascade,

  user_id uuid
    references auth.users(id) on delete set null,

  contact_type public.contact_type not null,

  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 15. PROPERTY REPORTS
-- ============================================================

create table public.property_reports (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id) on delete cascade,

  reporter_id uuid
    references auth.users(id) on delete set null,

  reason public.report_reason not null,

  description text,

  status public.report_status not null default 'OPEN',

  admin_id uuid
    references auth.users(id) on delete set null,

  admin_note text,

  created_at timestamptz not null default timezone('utc', now()),

  resolved_at timestamptz
);


-- ============================================================
-- 16. CONVERSATIONS
-- ============================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id) on delete cascade,

  buyer_id uuid not null
    references auth.users(id) on delete cascade,

  seller_id uuid not null
    references auth.users(id) on delete cascade,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  unique (property_id, buyer_id, seller_id)
);


-- ============================================================
-- 17. MESSAGES
-- ============================================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null
    references public.conversations(id) on delete cascade,

  sender_id uuid not null
    references auth.users(id) on delete cascade,

  message text not null check (length(trim(message)) > 0),

  is_read boolean not null default false,

  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  type public.notification_type not null,

  title text not null,

  message text not null,

  reference_type text,

  reference_id uuid,

  is_read boolean not null default false,

  created_at timestamptz not null default timezone('utc', now())
);


-- ============================================================
-- 19. UPDATED_AT TRIGGERS
-- ============================================================

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger identity_updated_at
before update on public.identity_verifications
for each row
execute function public.set_updated_at();

create trigger properties_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

create trigger saved_searches_updated_at
before update on public.saved_searches
for each row
execute function public.set_updated_at();

create trigger conversations_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();


-- ============================================================
-- 20. CREATE PROFILE AFTER AUTH SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    phone_verified
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      'New User'
    ),
    false
  );

  return new;

end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- 21. ADMIN CHECK FUNCTION
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
  );
$$;


-- ============================================================
-- 22. INDEXES
-- ============================================================

create index idx_cities_province
on public.cities(province_id);

create index idx_areas_city
on public.areas(city_id);

create index idx_societies_city
on public.societies(city_id);

create index idx_properties_seller
on public.properties(seller_id);

create index idx_properties_city
on public.properties(city_id);

create index idx_properties_area
on public.properties(area_id);

create index idx_properties_society
on public.properties(society_id);

create index idx_properties_purpose
on public.properties(purpose);

create index idx_properties_category
on public.properties(category);

create index idx_properties_type
on public.properties(property_type);

create index idx_properties_seller_type
on public.properties(seller_type);

create index idx_properties_price
on public.properties(price);

create index idx_properties_size
on public.properties(size);

create index idx_properties_status
on public.properties(status);

create index idx_properties_created
on public.properties(created_at desc);

create index idx_properties_search
on public.properties(
  status,
  city_id,
  purpose,
  property_type,
  seller_type
);

create index idx_property_media_property
on public.property_media(property_id, sort_order);

create index idx_favorites_user
on public.favorites(user_id);

create index idx_favorites_property
on public.favorites(property_id);

create index idx_property_views_property
on public.property_views(property_id);

create index idx_property_views_created
on public.property_views(created_at);

create index idx_property_contacts_property
on public.property_contacts(property_id);

create index idx_property_reports_property
on public.property_reports(property_id);

create index idx_property_reports_status
on public.property_reports(status);

create index idx_messages_conversation
on public.messages(conversation_id, created_at);

create index idx_notifications_user
on public.notifications(user_id, is_read, created_at desc);


-- ============================================================
-- 23. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.identity_verifications enable row level security;

alter table public.provinces enable row level security;
alter table public.cities enable row level security;
alter table public.areas enable row level security;
alter table public.societies enable row level security;

alter table public.properties enable row level security;
alter table public.property_media enable row level security;

alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;

alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;

alter table public.property_views enable row level security;
alter table public.property_contacts enable row level security;

alter table public.property_reports enable row level security;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

alter table public.notifications enable row level security;


-- ============================================================
-- 24. PUBLIC LOCATION POLICIES
-- ============================================================

create policy "Public can view provinces"
on public.provinces
for select
using (true);

create policy "Public can view cities"
on public.cities
for select
using (true);

create policy "Public can view areas"
on public.areas
for select
using (true);

create policy "Public can view societies"
on public.societies
for select
using (true);

create policy "Public can view amenities"
on public.amenities
for select
using (true);


-- ============================================================
-- 25. PROFILE POLICIES
-- ============================================================

create policy "Public can view active profiles"
on public.profiles
for select
using (
  is_active = true
  and is_blocked = false
);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);


-- ============================================================
-- 26. USER ROLE POLICIES
-- ============================================================

create policy "Admins can view roles"
on public.user_roles
for select
using (public.is_admin());


-- ============================================================
-- 27. IDENTITY POLICIES
-- ============================================================

create policy "Users can view own identity"
on public.identity_verifications
for select
using (auth.uid() = user_id);

create policy "Users can create own identity"
on public.identity_verifications
for insert
with check (auth.uid() = user_id);

create policy "Users can update own identity"
on public.identity_verifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins can manage identity"
on public.identity_verifications
for all
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- 28. PROPERTY POLICIES
-- ============================================================

create policy "Public can view published properties"
on public.properties
for select
using (
  status = 'PUBLISHED'
);

create policy "Owners can view own properties"
on public.properties
for select
using (
  auth.uid() = seller_id
);

create policy "Admins can view all properties"
on public.properties
for select
using (
  public.is_admin()
);

create policy "Users can create own properties"
on public.properties
for insert
with check (
  auth.uid() = seller_id
);

create policy "Users can update own properties"
on public.properties
for update
using (
  auth.uid() = seller_id
)
with check (
  auth.uid() = seller_id
);

create policy "Users can delete own properties"
on public.properties
for delete
using (
  auth.uid() = seller_id
);

create policy "Admins can manage properties"
on public.properties
for all
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- 29. PROPERTY MEDIA POLICIES
-- ============================================================

create policy "Public can view media for published properties"
on public.property_media
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.status = 'PUBLISHED'
  )
);

create policy "Owners can manage property media"
on public.property_media
for all
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.seller_id = auth.uid()
  )
);

create policy "Admins can manage property media"
on public.property_media
for all
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- 30. PROPERTY AMENITIES
-- ============================================================

create policy "Public can view property amenities"
on public.property_amenities
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.status = 'PUBLISHED'
  )
);

create policy "Owners can manage property amenities"
on public.property_amenities
for all
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.seller_id = auth.uid()
  )
);


-- ============================================================
-- 31. FAVORITES
-- ============================================================

create policy "Users can view own favorites"
on public.favorites
for select
using (
  auth.uid() = user_id
);

create policy "Users can add favorites"
on public.favorites
for insert
with check (
  auth.uid() = user_id
);

create policy "Users can remove own favorites"
on public.favorites
for delete
using (
  auth.uid() = user_id
);


-- ============================================================
-- 32. SAVED SEARCHES
-- ============================================================

create policy "Users can view own saved searches"
on public.saved_searches
for select
using (
  auth.uid() = user_id
);

create policy "Users can create saved searches"
on public.saved_searches
for insert
with check (
  auth.uid() = user_id
);

create policy "Users can update saved searches"
on public.saved_searches
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users can delete saved searches"
on public.saved_searches
for delete
using (
  auth.uid() = user_id
);


-- ============================================================
-- 33. PROPERTY REPORTS
-- ============================================================

create policy "Authenticated users can report properties"
on public.property_reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
);

create policy "Users can view own reports"
on public.property_reports
for select
using (
  auth.uid() = reporter_id
);

create policy "Admins can manage reports"
on public.property_reports
for all
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- 34. CONVERSATIONS
-- ============================================================

create policy "Participants can view conversations"
on public.conversations
for select
using (
  auth.uid() = buyer_id
  or auth.uid() = seller_id
);

create policy "Buyers can create conversations"
on public.conversations
for insert
with check (
  auth.uid() = buyer_id
);

create policy "Participants can update conversations"
on public.conversations
for update
using (
  auth.uid() = buyer_id
  or auth.uid() = seller_id
)
with check (
  auth.uid() = buyer_id
  or auth.uid() = seller_id
);


-- ============================================================
-- 35. MESSAGES
-- ============================================================

create policy "Participants can view messages"
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
    and (
      c.buyer_id = auth.uid()
      or c.seller_id = auth.uid()
    )
  )
);

create policy "Participants can send messages"
on public.messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
    and (
      c.buyer_id = auth.uid()
      or c.seller_id = auth.uid()
    )
  )
);


-- ============================================================
-- 36. NOTIFICATIONS
-- ============================================================

create policy "Users can view own notifications"
on public.notifications
for select
using (
  auth.uid() = user_id
);

create policy "Users can update own notifications"
on public.notifications
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- ============================================================
-- 37. PROPERTY VIEWS
-- ============================================================
-- For production, preferably insert views through a secure
-- Next.js server route using the Supabase service role.
-- ============================================================

create policy "Authenticated users can create property views"
on public.property_views
for insert
to authenticated
with check (
  auth.uid() = user_id
);


-- ============================================================
-- 38. PROPERTY CONTACTS
-- ============================================================

create policy "Authenticated users can create contacts"
on public.property_contacts
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Sellers can view contacts for own properties"
on public.property_contacts
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
    and p.seller_id = auth.uid()
  )
);


-- ============================================================
-- 39. SEED PROVINCE
-- ============================================================

insert into public.provinces (
  name,
  slug
)
values (
  'Punjab',
  'punjab'
)
on conflict (slug) do nothing;


-- ============================================================
-- 40. SEED LAHORE
-- ============================================================

insert into public.cities (
  province_id,
  name,
  slug
)
select
  p.id,
  'Lahore',
  'lahore'
from public.provinces p
where p.slug = 'punjab'
on conflict (province_id, slug) do nothing;


-- ============================================================
-- 41. LAHORE AREAS
-- ============================================================

insert into public.areas (
  city_id,
  name,
  slug
)
select
  c.id,
  area.name,
  area.slug
from public.cities c
cross join (
  values
    ('DHA Lahore', 'dha-lahore'),
    ('Gulberg', 'gulberg'),
    ('Johar Town', 'johar-town'),
    ('Model Town', 'model-town'),
    ('Wapda Town', 'wapda-town'),
    ('Valencia', 'valencia'),
    ('Lake City', 'lake-city'),
    ('Bahria Town Lahore', 'bahria-town-lahore'),
    ('Garden Town', 'garden-town'),
    ('Township', 'township')
) as area(name, slug)
where c.slug = 'lahore'
on conflict (city_id, slug) do nothing;


-- ============================================================
-- 42. LAHORE SOCIETIES
-- ============================================================

insert into public.societies (
  city_id,
  name,
  slug
)
select
  c.id,
  society.name,
  society.slug
from public.cities c
cross join (
  values
    ('DHA Lahore', 'dha-lahore'),
    ('Bahria Town Lahore', 'bahria-town-lahore'),
    ('Lake City Lahore', 'lake-city-lahore'),
    ('Valencia Housing Society', 'valencia-housing-society'),
    ('Wapda Town', 'wapda-town'),
    ('Model Town', 'model-town'),
    ('Gulberg', 'gulberg')
) as society(name, slug)
where c.slug = 'lahore'
on conflict (city_id, slug) do nothing;


-- ============================================================
-- 43. SEED AMENITIES
-- ============================================================

insert into public.amenities (
  name,
  slug,
  category
)
values
  ('Parking', 'parking', 'basic'),
  ('Security', 'security', 'security'),
  ('Electricity', 'electricity', 'utilities'),
  ('Gas', 'gas', 'utilities'),
  ('Water Supply', 'water-supply', 'utilities'),
  ('Sewerage', 'sewerage', 'utilities'),
  ('Garden', 'garden', 'outdoor'),
  ('Swimming Pool', 'swimming-pool', 'outdoor'),
  ('Servant Quarter', 'servant-quarter', 'rooms'),
  ('Store Room', 'store-room', 'rooms'),
  ('Central Air Conditioning', 'central-air-conditioning', 'comfort'),
  ('Air Conditioning', 'air-conditioning', 'comfort'),
  ('Elevator', 'elevator', 'building'),
  ('Backup Generator', 'backup-generator', 'utilities'),
  ('Internet', 'internet', 'utilities'),
  ('Mosque Nearby', 'mosque-nearby', 'location'),
  ('School Nearby', 'school-nearby', 'location'),
  ('Park Nearby', 'park-nearby', 'location')
on conflict (slug) do nothing;


-- ============================================================
-- END OF MIGRATION
-- ============================================================