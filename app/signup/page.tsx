import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAccountType, ROLE_PRIMARY_PATH } from "@/lib/auth-roles";
import type { AccountType } from "@/lib/property-options";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed) redirect("/onboarding");
    redirect(ROLE_PRIMARY_PATH[profile.account_type as AccountType]);
  }

  const initialRole = isAccountType(role) ? role : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] px-6 py-14 font-body">
      <SignupForm initialRole={initialRole} />
    </div>
  );
}
