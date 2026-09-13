"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_TYPES } from "@/lib/property-options";

export type ProfileActionResult = { error: string } | { ok: true } | null;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export async function updateProfile(
  _prev: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const fullName = str(formData, "full_name");
  const phoneNumber = str(formData, "phone_number");
  const accountType = str(formData, "account_type");
  const cityId = str(formData, "city_id");
  const bio = str(formData, "bio");

  if (!fullName) return { error: "Name is required." };
  if (!accountType || !ACCOUNT_TYPES.includes(accountType as (typeof ACCOUNT_TYPES)[number])) {
    return { error: "Invalid account type." };
  }

  // Basic sanity check, not strict validation — real phone verification
  // happens separately (phone_verified) once Phone OTP is wired up.
  if (phoneNumber && !/^[0-9+\-\s]{7,20}$/.test(phoneNumber)) {
    return { error: "That doesn't look like a valid phone number." };
  }

  let profilePhoto: string | undefined;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const path = `${user.id}/${Date.now()}-${avatar.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatar, {
      upsert: true,
    });
    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    profilePhoto = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
      account_type: accountType,
      city_id: cityId,
      bio,
      ...(profilePhoto ? { profile_photo: profilePhoto } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
