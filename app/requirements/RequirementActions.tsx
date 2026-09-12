"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pauseRequirement, reactivateRequirement, cancelRequirement } from "./actions";

export function RequirementActions({ requirementId, status }: { requirementId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error: string } | { ok: true }>) {
    startTransition(async () => {
      const result = await fn();
      if ("error" in result) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <a
        href={`/requirements/${requirementId}/edit`}
        className="flex-1 rounded-[9px] bg-[#EFF6FF] py-2.5 text-center font-display text-[12.5px] font-bold text-[#1D4ED8]"
      >
        Edit
      </a>
      {status === "PAUSED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => reactivateRequirement(requirementId))}
          className="flex-1 rounded-[9px] bg-[#ECFDF5] py-2.5 font-display text-[12.5px] font-bold text-[#15803D] disabled:opacity-50"
        >
          Reactivate
        </button>
      ) : status === "ACTIVE" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => pauseRequirement(requirementId))}
          className="flex-1 rounded-[9px] bg-[#FFF7E6] py-2.5 font-display text-[12.5px] font-bold text-[#B45309] disabled:opacity-50"
        >
          Pause
        </button>
      ) : null}
      {status !== "CANCELLED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this requirement? You can post a new one anytime.")) {
              run(() => cancelRequirement(requirementId));
            }
          }}
          className="flex-1 rounded-[9px] bg-[#FEF2F2] py-2.5 font-display text-[12.5px] font-bold text-[#DC2626] disabled:opacity-50"
        >
          {pending ? "..." : "Delete"}
        </button>
      )}
    </div>
  );
}
