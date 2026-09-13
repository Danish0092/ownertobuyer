# OwnerToBuyer — Features Built So Far

A Pakistani property marketplace (Lahore, Next.js 16 + Supabase) connecting owners, buyers, realtors, and developers directly — no agency, no verification claims, no commission.

Last updated: 2026-09-13

---

## 1. Tech Stack

- **Frontend**: Next.js 16 (App Router, Server Components, Server Actions), React 19, Tailwind v4
- **Backend**: Supabase (Postgres, Auth, Storage) — hosted project, no custom API server
- **Authorization model**: Row Level Security (RLS) on every table, always ownership-based (`seller_id`/`buyer_id`/`developer_id = auth.uid()`), never gated by account type or role for basic CRUD
- **Media**: Private Supabase Storage buckets (`property-media`, `avatars`, `project-media`) with signed URLs, never public raw file access

---

## 2. Authentication

- Email/password login (`/login`) and Supabase magic-link email
- `/auth/confirm` route handles the magic-link callback
- Session refresh + block-enforcement on every request via `proxy.ts` (Next.js middleware)
- **Account blocking**: an admin can block a user; blocked users are:
  - Signed out on their next request automatically
  - Rejected at login (password or magic link) with a generic error (doesn't reveal whether the account exists or is just blocked)
  - Their published listings disappear from public view (RLS excludes a blocked seller's properties from the public feed)
- `/account-blocked` — explanation page shown after a forced sign-out

---

## 3. Four Account Types

One `profiles.account_type` enum drives which dashboard a user sees. **Not a hard capability gate** — any signed-in user can still technically create a property or requirement; account type is UI/dashboard personalization, not a database-level restriction (a deliberate decision, confirmed with the user, to keep the model flexible).

| Type | Dashboard shows |
|---|---|
| **Owner** | My Properties (list/add/edit/delete), Potential Buyers |
| **Buyer** | My Requirements, Matching Properties, Favorites, Messages (placeholder) |
| **Realtor / Dealer** | Represented Properties, Client Requirements, Dealer Matches, Messages (placeholder) |
| **Developer / Society** | My Projects, Project Leads/Messages (placeholder) |

Switchable anytime from `/profile`.

---

## 4. Property Listings (Owner & Realtor)

### Posting (`/properties/new`)
- 6-step wizard: purpose/type → location → price/size/details → photos/video → seller type (Owner vs Realtor/Dealer) → preview
- Pakistani price format parsing ("1.90 Crore", "50 Lac")
- Real photo/video upload to private storage, first photo auto-set as primary
- **Realtor authorization checkbox**: required when posting as Realtor/Dealer — "I confirm I am authorized by the property owner..." — self-declared, explicitly **not verified** by the platform (`properties.representation_confirmed`), mirrors the existing `authority_status` "seller claims, not verified" pattern
- Publishes immediately (no moderation queue)

### Editing (`/properties/[slug]/edit`)
- Same field set, owner-only (RLS-enforced)
- Editing never resets the Realtor's authorization confirmation (deliberately kept out of the shared form parser)

### Public detail page (`/properties/[slug]`)
- Full gallery (signed URLs), specs, amenities, location
- **Owner vs Realtor framing**: "LISTED BY OWNER" vs "LISTED BY REALTOR", "Represented by {name}" for Realtor listings — never implies the realtor owns the property
- Authorization disclosure shown for confirmed Realtor listings, explicitly self-declared
- Seller contact card: real WhatsApp/Call buttons (disabled gracefully if no phone on file)
- Report button, Save/Favorite button
- "Verify everything yourself" legal disclaimer

### Dashboard (`/dashboard`, Owner/Realtor view)
- Tabs: All / Published (Active for Realtors) / Draft / Sold-Rented / Hidden
- Per-listing views/contacts counts, match badges, Edit/Delete
- Realtor view: relabeled "Represented Properties", "+ Add Represented Property", plus "Client Requirements" and "Dealer Matches" quick links

---

## 5. Search & Discovery

- `/search` — URL-driven filters (purpose, seller type, property type, bedrooms, furnished, price max, sort), real photos on cards
- Home page (`/`) — category counts, featured owner-direct listings, popular areas, all wired to real data (no placeholder numbers)
- `/saved` — a buyer's favorited listings, with instant unsave (verified to actually delete the row, not just hide it client-side)

---

## 6. Buyer Requirements ("I need a property")

### Posting (`/requirements/new`)
- Purpose, category/type, location (city/area/society), budget range, size range, payment type, possession urgency, bedrooms/bathrooms minimums, furnished preference, 30/60/90-day expiry
- Same Pakistani price parsing as properties

### Management (`/requirements`)
- List of the buyer's own requirements with status (Active/Paused/Fulfilled/Expired/Cancelled), match counts
- **Edit** — full edit form, reactivating an expired requirement gives it a fresh 30-day expiry
- **Pause / Reactivate** — toggles matching on/off without losing the requirement
- **Delete** — soft (status → Cancelled), keeps history

---

## 7. Matching Engine

**Architecture**: hybrid — computed synchronously and persisted (not a background job, not recomputed on every page view). Two Postgres trigger points:
1. A property is inserted/edited → rescans active requirements
2. A requirement is inserted/edited → rescans published properties

**Scoring** (`calculate_match_score`, deterministic, fully explainable — never a black-box AI score):

| Factor | Weight |
|---|---|
| Location (society > area > city) | 35 |
| Budget in range | 25 |
| Size in range (auto-converted between Marla/Kanal/Sq Ft/etc.) | 20 |
| Property type/category | 10 |
| Purpose match | 5 (hard prerequisite — a rent listing can never match a buy requirement, regardless of everything else) |
| Cash buyer | 5 |

Matches ≥ 50% are persisted to `requirement_matches` with a plain-language `reasons` array (e.g. "Same society", "Price within buyer budget"). Notifications fire only the first time a pair crosses the threshold — editing a listing repeatedly doesn't spam duplicate alerts. Matches are automatically cleaned up when either side becomes stale (price moves out of range, listing hidden, requirement expires, etc.).

### Seller-facing view (`/dashboard/matches`)
"Potential Buyer Found — X% Match" for each of your properties, with the buyer's real name and a working WhatsApp/Call button (buyer contact info is public by the same rule that already makes seller phone numbers public — not a new privacy exposure).

### Buyer-facing view (`/requirements/matches`)
"Matching Properties" for each of your requirements — real property cards with photos, linking straight to the listing.

### Dealer Match (`/dashboard/dealer-matches`)
A Realtor operates on both sides at once (lists properties, posts client requirements) — this page is a straight union of the two views above in one screen, since the underlying matching engine already treated a Realtor's data identically to an Owner's or Buyer's. No new matching logic; a consolidated view is all that was needed.

---

## 8. Realtor / Dealer (Module 2)

- Same `properties` table, no duplicate schema — `seller_id` (who manages the listing) + `seller_type` (Owner/Dealer) already fully model "represents, doesn't own"
- One new column: `representation_confirmed` (self-declared authorization claim)
- Public UI never implies ownership — "Represented by {name}"
- Dashboard: "Represented Properties" instead of "My Properties", "Client Requirements" reuses the existing buyer-requirements feature as-is (a client requirement is just the Realtor's own requirement row)

---

## 9. Developer / Society Projects (Module 3)

New entity — a project is a container of multiple inventory unit types plus its own media, genuinely different from a single property.

- **`projects`** — name, developer/society brand name, location, approval status (self-declared claim, reuses `authority_status`), development progress (Planning/Under Construction/Partially Completed/Completed/On Hold — kept separate from publish status since a project is normally live while still being built), starting price range, contact info
- **`project_inventory`** — unit types within a project (type, size, price range, total/available units, payment plan)
- **`project_media`** — photos/videos, same private-bucket-with-signed-URLs pattern as properties

### Flow
- `/projects/new` — Save as Draft or Publish
- `/projects/[slug]/inventory` — add/remove unit types
- `/projects/[slug]` — public page: development-status badge, inventory list, non-verification disclosure, WhatsApp/Call using the project's own contact info
- `/projects/[slug]/edit`
- Dashboard (Developer view): real project list with Inventory/Edit/Hide actions

### Buyer-facing discovery (added after Module 3, since the module initially had no browse surface)
- `/projects` — public "New Developments" browse page
- "Projects" link in the main nav
- "New Developments" section on the homepage (mirrors the existing "Properties Directly From Owners" section, hides itself when empty)

---

## 10. Admin Panel

- `/admin` — separate authentication flow (`/admin/login`), redirects unauthenticated visitors there and non-admins to `/dashboard`; never shows the login form to an already-authenticated user
- Dashboard: real metrics (users, properties, published listings, reports, blocked users, views, contacts)
- **Users**: list, Suspend/Unblock
- **Properties**: list, Hide/Unhide (for fake/bad listings)
- **Reports**: list, Dismiss / Hide Listing (from a report)
- All admin Server Actions independently re-verify admin status server-side (never trust a client-passed role); RLS enforces the same at the database level

---

## 11. Trust, Safety & Legal

- Property reports (fake listing, wrong price, spam, etc.) — buyers can report, admins can act
- Consistent "seller claims, not platform-verified" framing everywhere a claim is collected (`authority_status` on properties, `approval_status` on projects, `representation_confirmed` for Realtors)
- Legal/info pages: `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/safety` — real content specific to how this platform actually works, not generic boilerplate
- Shared footer with working links on Home, Search, and Property Detail

---

## 12. Security Model (cross-cutting)

- RLS on every table; every policy uses `(select auth.uid())`/`(select is_admin())` (planner-cached, not re-evaluated per row) after an earlier performance pass fixed ~109 advisor warnings down to a handful of accepted, harmless ones
- No account-type-based authorization anywhere — always ownership (`*_id = auth.uid()`) or admin
- CNIC/identity verification table (`identity_verifications`) exists with strict RLS but is not yet wired into any feature — reserved for a future "Verified Owner" badge
- Every new feature in this project has been verified live against the hosted database (not just "it compiles") before being called done, including deliberate unauthorized-access attempts (raw anon REST calls) to confirm RLS actually blocks what it should

---

## 13. Explicitly NOT Built Yet

- In-app messaging/chat (schema exists — `conversations`/`messages` tables — but no UI; "Chat" shows as "Coming Soon" everywhere)
- Notifications UI (rows are written to the `notifications` table by the matching engine, but nothing in the app displays them — no bell icon, no inbox)
- Offers / counter-offers / negotiation
- Buyer Demand Map (aggregated society-level demand stats)
- "Serious Buyer" / "Verified Owner" badges (identity table exists, unused)
- Phone OTP login (blocked on picking an SMS provider)
- Any monetization (featured listings, subscriptions, etc.)
- Local Docker dev environment fix (hosted Supabase works fine; local `supabase start` has an unresolved CLI-level issue, deferred)

---

## 14. Repo Pointers

- Migrations: `supabase/migrations/` — one file per change, additive-only, never rewritten after being applied to the hosted project
- Shared parsers: `lib/parse-property-form.ts`, `lib/parse-requirement-form.ts`, `lib/parse-project-form.ts` (one per entity, shared between create/edit flows)
- Shared card components: `PropertyCard`, `ProjectCard`, `PotentialBuyerCard`, `MatchingPropertyCard`
- Media resolution: `lib/property-media.ts`, `lib/project-media.ts` (batched signed URLs, one request per page load instead of one per card)
