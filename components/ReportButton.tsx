"use client";

import { useState } from "react";
import { ReportModal } from "@/components/ReportModal";

export function ReportButton({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-none text-[13px] text-[#94A3B8] underline"
      >
        Report this listing
      </button>
      <ReportModal propertyId={propertyId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
