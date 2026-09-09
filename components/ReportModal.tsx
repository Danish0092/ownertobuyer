"use client";

import { useState, useTransition } from "react";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";
import { submitReport } from "@/app/properties/[slug]/actions";

export function ReportModal({
  propertyId,
  open,
  onClose,
}: {
  propertyId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleClose() {
    onClose();
    // Reset after the close animation would run, if there were one —
    // here just reset immediately since the modal unmounts.
    setReason(null);
    setSubmitted(false);
    setError(null);
  }

  function handleSubmit() {
    if (!reason) return;
    startTransition(async () => {
      const result = await submitReport(propertyId, reason);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setSubmitted(true);
    });
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[#0B2545]/55 p-5 font-body">
      <div className="w-full max-w-[420px] rounded-[20px] bg-white p-6.5">
        {submitted ? (
          <>
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#14B8A6]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-1.5 font-display text-lg font-bold text-[#101828]">Report Submitted</h3>
            <p className="mb-4.5 text-[13.5px] text-[#667085]">Thanks — our team will review this listing.</p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-[#2563EB] py-3.5 font-display text-sm font-extrabold text-white"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="mb-1 font-display text-lg font-bold text-[#101828]">Report this listing</h3>
            <p className="mb-4 text-[13.5px] text-[#667085]">Why are you reporting this property?</p>
            <div className="mb-5 flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#344054]"
                  style={{ background: reason === r.value ? "#EFF6FF" : "transparent" }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#2563EB]"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl bg-[#F1F5F9] py-3.5 font-display text-[13.5px] font-bold text-[#475467]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason || pending}
                onClick={handleSubmit}
                className="flex-1 rounded-xl py-3.5 font-display text-[13.5px] font-extrabold text-white disabled:cursor-not-allowed"
                style={{
                  background: !reason || pending ? "#CBD5E1" : "linear-gradient(135deg,#DC2626,#EA580C)",
                }}
              >
                {pending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
