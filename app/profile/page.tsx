import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: cities }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone_number, account_type, city_id, bio, profile_photo")
      .eq("id", user.id)
      .single(),
    supabase.from("cities").select("id, name").order("name"),
  ]);

  if (!profile) {
    // The handle_new_user trigger creates this row on signup, so this
    // should never happen for a real authenticated user.
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-6 py-12">
        <h1 className="mb-1 font-display text-2xl font-extrabold text-[#101828]">Your profile</h1>
        <p className="mb-8 text-sm text-[#667085]">
          Your name and phone number are shown to buyers on your listings so
          they can contact you directly — this is a public marketplace
          profile, not a private account page.
        </p>
        <ProfileForm profile={profile} cities={cities ?? []} />
      </main>
    </div>
  );
}
