"use client";

import { useActionState, useState } from "react";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/property-options";
import { updateProfile } from "./actions";

type Profile = {
  full_name: string;
  phone_number: string | null;
  account_type: string;
  city_id: string | null;
  bio: string | null;
  profile_photo: string | null;
};

const inputClass =
  "rounded border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2] dark:bg-black dark:text-zinc-50";
const labelClass = "flex flex-col gap-1 text-sm text-black dark:text-zinc-50";

export function ProfileForm({
  profile,
  cities,
}: {
  profile: Profile;
  cities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const [preview, setPreview] = useState<string | null>(profile.profile_photo);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state && "error" in state && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Profile updated.
        </p>
      )}

      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-lg font-bold text-[#1D4ED8]">
            {profile.full_name.charAt(0)}
          </div>
        )}
        <label className="text-sm text-black dark:text-zinc-50">
          <span className="mb-1 block text-xs text-zinc-500">Profile photo</span>
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="text-xs"
          />
        </label>
      </div>

      <label className={labelClass}>
        Full name *
        <input name="full_name" required defaultValue={profile.full_name} className={inputClass} />
      </label>

      <label className={labelClass}>
        Phone number
        <input
          name="phone_number"
          type="tel"
          defaultValue={profile.phone_number ?? ""}
          placeholder="03xx-xxxxxxx"
          className={inputClass}
        />
        <span className="text-xs text-zinc-500">
          Shown to buyers on your listings so they can Call / WhatsApp you directly.
        </span>
      </label>

      <label className={labelClass}>
        Account type *
        <select name="account_type" required defaultValue={profile.account_type} className={inputClass}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">Changes which dashboard you see — you can change this anytime.</span>
      </label>

      <label className={labelClass}>
        City
        <select name="city_id" defaultValue={profile.city_id ?? ""} className={inputClass}>
          <option value="">— None —</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Bio
        <textarea name="bio" rows={3} defaultValue={profile.bio ?? ""} className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
