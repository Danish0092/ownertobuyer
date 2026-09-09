"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProperty } from "./actions";

export function DeletePropertyButton({ propertyId, title }: { propertyId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete "${title}"? It will be removed from search and your listings.`)) return;
    startTransition(async () => {
      const result = await deleteProperty(propertyId);
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
      className="flex-1 rounded-[9px] bg-[#FEF2F2] py-2.5 font-display text-[12.5px] font-bold text-[#DC2626] disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
