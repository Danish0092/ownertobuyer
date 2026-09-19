import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAccountType, ROLE_PRIMARY_PATH } from "@/lib/auth-roles";
import type { AccountType } from "@/lib/property-options";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  // Already picked a role — don't re-prompt on every login.
  if (profile?.onboarding_completed) {
    redirect(ROLE_PRIMARY_PATH[profile.account_type as AccountType]);
  }

  const preselected = isAccountType(role) ? role : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] px-6 py-14 font-body">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-[#101828]">Tell us about yourself</h1>
          <p className="text-sm text-[#667085]">Select the option that best describes how you will use OwnerToBuyer.</p>
        </div>
        <OnboardingForm preselected={preselected} />
      </div>
    </div>
  );
}
