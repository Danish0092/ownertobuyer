"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Real favorites toggle (writes to public.favorites) — not just a
// decorative heart. RLS already permits a user to insert/delete their
// own favorites rows, so this talks to Supabase directly from the
// client with no server action needed.
export function SaveButton({
  propertyId,
  initialSaved,
  isLoggedIn,
}: {
  propertyId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setPending(true);
    const next = !saved;
    setSaved(next); // optimistic

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      router.push("/login");
      return;
    }

    const { error } = next
      ? await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId })
      : await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);

    if (error) setSaved(!next); // revert on failure
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Remove from saved" : "Save property"}
      className="ml-auto flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#E4E9F2] bg-white"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "#EF4444" : "none"} stroke="#EF4444" strokeWidth={1.6}>
        <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4c2.2-.3 4 .9 6.4 3.4C14.4 4.9 16.2 3.7 18.4 4c3.6.5 5.2 4 3.6 7.7C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
