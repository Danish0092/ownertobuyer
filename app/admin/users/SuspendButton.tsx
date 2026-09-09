"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserBlock } from "../actions";

export function SuspendButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const verb = isBlocked ? "unblock" : "suspend";
    if (!confirm(`Are you sure you want to ${verb} this user?`)) return;
    startTransition(async () => {
      const result = await toggleUserBlock(userId, isBlocked);
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
      className="rounded-lg bg-[#EFF6FF] px-3 py-1.5 font-display text-xs font-bold text-[#1D4ED8] disabled:opacity-50"
    >
      {pending ? "..." : isBlocked ? "Unblock" : "Suspend"}
    </button>
  );
}
