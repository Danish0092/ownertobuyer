"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInventoryItem } from "./actions";

export function InventoryRowActions({ itemId, projectSlug }: { itemId: string; projectSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remove this unit type from the project?")) return;
    startTransition(async () => {
      const result = await deleteInventoryItem(itemId, projectSlug);
      if (result && "error" in result) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg bg-[#FEF2F2] px-3 py-1.5 font-display text-[11.5px] font-bold text-[#DC2626] disabled:opacity-50"
    >
      {pending ? "..." : "Remove"}
    </button>
  );
}
