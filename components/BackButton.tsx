"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="rounded-[10px] border border-[#E4E9F2] bg-white px-3.5 py-2 font-display text-[12.5px] font-bold text-[#123A63]"
    >
      ← Back
    </button>
  );
}
