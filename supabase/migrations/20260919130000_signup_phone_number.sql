-- Store the phone number collected on the signup form (sent as auth user
-- metadata) in profiles.phone_number — the same field the profile page edits
-- and listings show to buyers. Trimmed and length-capped; anything blank
-- stays null.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_number, phone_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    nullif(left(btrim(new.raw_user_meta_data ->> 'phone_number'), 20), ''),
    false
  );
  return new;
end;
$$;
