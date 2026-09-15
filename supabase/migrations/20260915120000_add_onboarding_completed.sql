-- Tracks whether a user has been through the "choose your primary role"
-- onboarding screen. account_type stays NOT NULL DEFAULT 'OWNER' (untouched)
-- so nothing else that reads it needs to handle a null case — this new
-- column is purely "has the user confirmed a role", used to gate the
-- onboarding redirect for brand-new signups without ever re-prompting
-- someone who already uses the product.
alter table public.profiles
  add column onboarding_completed boolean;

-- Every existing profile got here through the product already (posted a
-- property, requirement, etc. under the default/self-picked account_type),
-- so treat them as already onboarded before the column becomes NOT NULL.
update public.profiles set onboarding_completed = true;

alter table public.profiles
  alter column onboarding_completed set not null,
  alter column onboarding_completed set default false;
