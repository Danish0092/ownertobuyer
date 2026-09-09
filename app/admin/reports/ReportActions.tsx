"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissReport, hideListingFromReport } from "../actions";

export function ReportActions({ reportId, propertyId }: { reportId: string; propertyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle(fn: () => Promise<{ error: string } | { ok: true }>) {
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
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => handle(() => dismissReport(reportId))}
        className="rounded-lg bg-[#F1F5F9] px-2.5 py-1.5 font-display text-[11.5px] font-bold text-[#334155] disabled:opacity-50"
      >
        Dismiss
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Hide this listing from public view?")) handle(() => hideListingFromReport(reportId, propertyId));
        }}
        className="rounded-lg bg-[#FEF2F2] px-2.5 py-1.5 font-display text-[11.5px] font-bold text-[#DC2626] disabled:opacity-50"
      >
        Hide Listing
      </button>
    </div>
  );
}
