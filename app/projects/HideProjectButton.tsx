"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { hideProject } from "./actions";

export function HideProjectButton({ projectId, name }: { projectId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Hide "${name}"? It will disappear from public view — you can publish it again from Edit.`)) return;
    startTransition(async () => {
      const result = await hideProject(projectId);
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
      className="flex-1 rounded-[9px] bg-[#FEF2F2] py-2.5 text-center font-display text-[12.5px] font-bold text-[#DC2626] disabled:opacity-50"
    >
      {pending ? "..." : "Hide"}
    </button>
  );
}
