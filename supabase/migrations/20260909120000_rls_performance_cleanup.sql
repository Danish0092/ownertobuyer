-- ============================================================
-- RLS PERFORMANCE CLEANUP
--
-- Addresses the two Supabase advisor warning categories deferred
-- since the initial schema push:
--
--   auth_rls_initplan (~30 warnings): policies called auth.uid() /
--   is_admin() directly, which Postgres re-evaluates once per row.
--   Wrapping the call as (select auth.uid()) lets the planner treat
--   it as a constant for the whole statement instead.
--
--   multiple_permissive_policies (~79 warnings): several tables had
--   an admin "ALL" policy stacked on top of separate owner/public
--   policies for the same action (e.g. properties SELECT had FOUR
--   overlapping permissive policies: admin-ALL, a redundant
--   admin-SELECT, owner, and public). Postgres evaluates every
--   permissive policy for a given action and ORs the results — so
--   four separate policies means four separate checks per row.
--   Consolidated here into exactly one policy per (table, action),
--   with the same conditions OR'd together explicitly instead.
--
-- No access-control behavior changes: every condition below is the
-- same logic the dropped policies expressed, just combined and with
-- auth calls made statement-cached instead of per-row.
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- "Public can view active profiles" has no auth.*/is_admin() call and
-- no overlapping policy — left as-is.


-- ============================================================
-- USER_ROLES
-- ============================================================

drop policy if exists "Admins can view roles" on public.user_roles;
create policy "Admins can view roles"
on public.user_roles
for select
using ((select public.is_admin()));


-- ============================================================
-- IDENTITY_VERIFICATIONS
-- Previously: one admin "ALL" policy stacked on three separate
-- owner policies (2x overlap on select/insert/update).
-- ============================================================

drop policy if exists "Admins can manage identity" on public.identity_verifications;
drop policy if exists "Users can view own identity" on public.identity_verifications;
drop policy if exists "Users can create own identity" on public.identity_verifications;
drop policy if exists "Users can update own identity" on public.identity_verifications;

create policy "Identity select: own or admin"
on public.identity_verifications
for select
using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Identity insert: own or admin"
on public.identity_verifications
for insert
with check ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Identity update: own or admin"
on public.identity_verifications
for update
using ((select auth.uid()) = user_id or (select public.is_admin()))
with check ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Identity delete: admin only"
on public.identity_verifications
for delete
using ((select public.is_admin()));


-- ============================================================
-- PROPERTIES
-- Previously: SELECT had FOUR overlapping permissive policies
-- (admin-ALL, a redundant admin-only SELECT, owner, public).
-- INSERT/UPDATE/DELETE each had admin-ALL stacked on an owner policy.
-- ============================================================

drop policy if exists "Admins can manage properties" on public.properties;
drop policy if exists "Admins can view all properties" on public.properties;
drop policy if exists "Owners can view own properties" on public.properties;
drop policy if exists "Public can view published properties" on public.properties;
drop policy if exists "Users can create own properties" on public.properties;
drop policy if exists "Users can update own properties" on public.properties;
drop policy if exists "Users can delete own properties" on public.properties;

create policy "Properties select: published, own, or admin"
on public.properties
for select
using (
  status = 'PUBLISHED'
  or seller_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "Properties insert: own or admin"
on public.properties
for insert
with check (seller_id = (select auth.uid()) or (select public.is_admin()));

create policy "Properties update: own or admin"
on public.properties
for update
using (seller_id = (select auth.uid()) or (select public.is_admin()))
with check (seller_id = (select auth.uid()) or (select public.is_admin()));

create policy "Properties delete: own or admin"
on public.properties
for delete
using (seller_id = (select auth.uid()) or (select public.is_admin()));


-- ============================================================
-- PROPERTY_AMENITIES
-- Previously: owner "ALL" policy stacked on a public SELECT policy.
-- ============================================================

drop policy if exists "Owners can manage property amenities" on public.property_amenities;
drop policy if exists "Public can view property amenities" on public.property_amenities;

create policy "Property amenities select: published or own"
on public.property_amenities
for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_amenities.property_id
    and (p.status = 'PUBLISHED' or p.seller_id = (select auth.uid()))
  )
);

create policy "Property amenities insert: own property"
on public.property_amenities
for insert
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_amenities.property_id
    and p.seller_id = (select auth.uid())
  )
);

create policy "Property amenities update: own property"
on public.property_amenities
for update
using (
  exists (
    select 1 from public.properties p
    where p.id = property_amenities.property_id
    and p.seller_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_amenities.property_id
    and p.seller_id = (select auth.uid())
  )
);

create policy "Property amenities delete: own property"
on public.property_amenities
for delete
using (
  exists (
    select 1 from public.properties p
    where p.id = property_amenities.property_id
    and p.seller_id = (select auth.uid())
  )
);


-- ============================================================
-- PROPERTY_MEDIA
-- Previously: SELECT had 3 overlapping permissive policies
-- (admin-ALL, owner-ALL, public). INSERT/UPDATE/DELETE each had 2
-- (admin-ALL + owner-ALL).
-- ============================================================

drop policy if exists "Admins can manage property media" on public.property_media;
drop policy if exists "Owners can manage property media" on public.property_media;
drop policy if exists "Public can view media for published properties" on public.property_media;

create policy "Property media select: published, own, or admin"
on public.property_media
for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.status = 'PUBLISHED'
  )
  or exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.seller_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Property media insert: own or admin"
on public.property_media
for insert
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.seller_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Property media update: own or admin"
on public.property_media
for update
using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.seller_id = (select auth.uid())
  )
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.seller_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Property media delete: own or admin"
on public.property_media
for delete
using (
  exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.seller_id = (select auth.uid())
  )
  or (select public.is_admin())
);


-- ============================================================
-- PROPERTY_CONTACTS
-- Single policy per action already — just wrap auth.uid().
-- ============================================================

drop policy if exists "Authenticated users can create contacts" on public.property_contacts;
create policy "Authenticated users can create contacts"
on public.property_contacts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Sellers can view contacts for own properties" on public.property_contacts;
create policy "Sellers can view contacts for own properties"
on public.property_contacts
for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_contacts.property_id
    and p.seller_id = (select auth.uid())
  )
);


-- ============================================================
-- PROPERTY_REPORTS
-- Previously: admin-ALL stacked on own-insert and own-select.
-- ============================================================

drop policy if exists "Admins can manage reports" on public.property_reports;
drop policy if exists "Authenticated users can report properties" on public.property_reports;
drop policy if exists "Users can view own reports" on public.property_reports;

create policy "Reports select: own or admin"
on public.property_reports
for select
using (reporter_id = (select auth.uid()) or (select public.is_admin()));

create policy "Reports insert: own"
on public.property_reports
for insert
to authenticated
with check (reporter_id = (select auth.uid()));

create policy "Reports update: admin only"
on public.property_reports
for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Reports delete: admin only"
on public.property_reports
for delete
using ((select public.is_admin()));


-- ============================================================
-- PROPERTY_VIEWS / FAVORITES / SAVED_SEARCHES / NOTIFICATIONS
-- / CONVERSATIONS / MESSAGES
-- No overlapping policies on any of these — just wrap auth.uid().
-- ============================================================

drop policy if exists "Authenticated users can create property views" on public.property_views;
create policy "Authenticated users can create property views"
on public.property_views
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
on public.favorites
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add favorites" on public.favorites;
create policy "Users can add favorites"
on public.favorites
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can remove own favorites"
on public.favorites
for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own saved searches" on public.saved_searches;
create policy "Users can view own saved searches"
on public.saved_searches
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create saved searches" on public.saved_searches;
create policy "Users can create saved searches"
on public.saved_searches
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update saved searches" on public.saved_searches;
create policy "Users can update saved searches"
on public.saved_searches
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete saved searches" on public.saved_searches;
create policy "Users can delete saved searches"
on public.saved_searches
for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
on public.conversations
for select
using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);

drop policy if exists "Buyers can create conversations" on public.conversations;
create policy "Buyers can create conversations"
on public.conversations
for insert
with check ((select auth.uid()) = buyer_id);

drop policy if exists "Participants can update conversations" on public.conversations;
create policy "Participants can update conversations"
on public.conversations
for update
using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id)
with check ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
on public.messages
for select
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
    and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
    and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
  )
);


-- ============================================================
-- STORAGE.OBJECTS
-- Previously 10 policies across both buckets with heavy overlap:
-- SELECT alone had 4 permissive policies competing (admin-ALL,
-- owner-select, public-property-select, public-avatars-select).
-- Consolidated to exactly 4 policies total (one per action),
-- branching on bucket_id internally.
-- ============================================================

drop policy if exists "Admins can manage all property media files" on storage.objects;
drop policy if exists "Owners can view own property media files" on storage.objects;
drop policy if exists "Public can view media for published properties" on storage.objects;
drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Owners can upload own property media files" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Owners can update own property media files" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Owners can delete own property media files" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

create policy "Storage select: avatars, own/published media, or admin"
on storage.objects
for select
using (
  bucket_id = 'avatars'
  or (
    bucket_id = 'property-media'
    and (
      exists (
        select 1 from public.properties p
        where p.id = (storage.foldername(objects.name))[1]::uuid
        and (p.status = 'PUBLISHED' or p.seller_id = (select auth.uid()))
      )
      or (select public.is_admin())
    )
  )
);

create policy "Storage insert: own avatar, own media, or admin"
on storage.objects
for insert
with check (
  (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  or (
    bucket_id = 'property-media'
    and (
      exists (
        select 1 from public.properties p
        where p.id = (storage.foldername(objects.name))[1]::uuid
        and p.seller_id = (select auth.uid())
      )
      or (select public.is_admin())
    )
  )
);

create policy "Storage update: own avatar, own media, or admin"
on storage.objects
for update
using (
  (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  or (
    bucket_id = 'property-media'
    and (
      exists (
        select 1 from public.properties p
        where p.id = (storage.foldername(objects.name))[1]::uuid
        and p.seller_id = (select auth.uid())
      )
      or (select public.is_admin())
    )
  )
)
with check (
  (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  or (
    bucket_id = 'property-media'
    and (
      exists (
        select 1 from public.properties p
        where p.id = (storage.foldername(objects.name))[1]::uuid
        and p.seller_id = (select auth.uid())
      )
      or (select public.is_admin())
    )
  )
);

create policy "Storage delete: own avatar, own media, or admin"
on storage.objects
for delete
using (
  (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  or (
    bucket_id = 'property-media'
    and (
      exists (
        select 1 from public.properties p
        where p.id = (storage.foldername(objects.name))[1]::uuid
        and p.seller_id = (select auth.uid())
      )
      or (select public.is_admin())
    )
  )
);
