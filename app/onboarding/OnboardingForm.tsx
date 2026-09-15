"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, type OnboardingResult } from "./actions";
import type { AccountType } from "@/lib/property-options";

const ROLES: { value: AccountType; icon: string; title: string; description: string }[] = [
  { value: "OWNER", icon: "🏠", title: "I Have a Property", description: "Sell or rent your property directly." },
  { value: "BUYER", icon: "🔎", title: "I Need a Property", description: "Find a property and post your requirement." },
  {
    value: "DEALER",
    icon: "👔",
    title: "I Am a Realtor / Dealer",
    description: "Manage properties you represent and your client requirements.",
  },
  {
    value: "DEVELOPER",
    icon: "🏗️",
    title: "I Am a Developer / Society",
    description: "Showcase your projects and manage inventory.",
  },
];

export function OnboardingForm({ preselected }: { preselected: AccountType | null }) {
  const [selected, setSelected] = useState<AccountType | null>(preselected);
  const [state, formAction, pending] = useActionState<OnboardingResult, FormData>(completeOnboarding, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="account_type" value={selected ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((role) => {
          const isSelected = selected === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              aria-pressed={isSelected}
              className={`flex flex-col items-start gap-2 rounded-2xl border-2 bg-white p-5 text-left shadow-[0_6px_18px_rgba(16,24,40,0.06)] transition-colors ${
                isSelected ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-[#EAEFF6]"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {role.icon}
              </span>
              <span className="font-display text-[15px] font-bold text-[#101828]">{role.title}</span>
              <span className="text-sm text-[#667085]">{role.description}</span>
            </button>
          );
        })}
      </div>

      {state?.error && <p className="mt-4 text-center font-body text-[13px] text-[#DC2626]">{state.error}</p>}

      <button
        type="submit"
        disabled={!selected || pending}
        className="mt-7 w-full rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] py-3 font-display text-sm font-extrabold text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
