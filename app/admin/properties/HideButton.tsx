"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePropertyHide } from "../actions";

export function HideButton({ propertyId, status }: { propertyId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isHidden = status === "HIDDEN";

  function handleClick() {
    startTransition(async () => {
      const result = await togglePropertyHide(propertyId, status);
      if ("error" in result) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-[#F1F5F9] px-3 py-1.5 font-display text-xs font-bold text-[#334155] disabled:opacity-50"
    >
      {pending ? "..." : isHidden ? "Unhide" : "Hide"}
    </button>
  );
}
