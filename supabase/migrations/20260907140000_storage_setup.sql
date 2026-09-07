-- ============================================================
-- STORAGE SETUP
-- Two buckets:
--   - property-media : private, RLS-controlled, mirrors the
--     visibility rules already on public.properties /
--     public.property_media
--   - avatars        : public read (profile photos are not
--     sensitive), owner-only write, one folder per user
-- ============================================================

-- ============================================================
-- 1. BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  false,
  52428800, -- 50 MiB, matches [storage] file_size_limit in config.toml
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MiB, plenty for a profile photo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;


-- ============================================================
-- 2. PROPERTY-MEDIA POLICIES
-- Path convention: {property_id}/{filename}
-- (storage.foldername(name))[1] is the first path segment.
-- ============================================================

create policy "Public can view media for published properties"
on storage.objects
for select
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.status = 'PUBLISHED'
  )
);

create policy "Owners can view own property media files"
on storage.objects
for select
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.seller_id = auth.uid()
  )
);

create policy "Owners can upload own property media files"
on storage.objects
for insert
with check (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.seller_id = auth.uid()
  )
);

create policy "Owners can update own property media files"
on storage.objects
for update
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.seller_id = auth.uid()
  )
)
with check (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.seller_id = auth.uid()
  )
);

create policy "Owners can delete own property media files"
on storage.objects
for delete
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.id = (storage.foldername(name))[1]::uuid
    and p.seller_id = auth.uid()
  )
);

create policy "Admins can manage all property media files"
on storage.objects
for all
using (
  bucket_id = 'property-media'
  and public.is_admin()
)
with check (
  bucket_id = 'property-media'
  and public.is_admin()
);


-- ============================================================
-- 3. AVATAR POLICIES
-- Path convention: {user_id}/{filename}
-- ============================================================

create policy "Public can view avatars"
on storage.objects
for select
using (
  bucket_id = 'avatars'
);

create policy "Users can upload own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
