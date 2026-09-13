import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { PostPropertyWizard } from "./PostPropertyWizard";

export default async function NewPropertyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // The wizard's City field is a disabled "Lahore" input (matching
  // the design exactly) — this is a single-city platform for now, so
  // there's nothing to actually choose yet.
  const [{ data: city }, { data: profile }] = await Promise.all([
    supabase.from("cities").select("id, name").eq("slug", "lahore").single(),
    supabase.from("profiles").select("account_type").eq("id", user.id).single(),
  ]);

  const [{ data: areas }, { data: societies }] = await Promise.all([
    supabase.from("areas").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
    supabase.from("societies").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <PostPropertyWizard
        cityId={city?.id ?? ""}
        cityName={city?.name ?? "Lahore"}
        areas={areas ?? []}
        societies={societies ?? []}
        // properties.seller_type only has OWNER/DEALER — account_type can now
        // also be BUYER/DEVELOPER, neither of which is a valid seller_type, so
        // this maps rather than passing account_type straight through.
        defaultSellerType={profile?.account_type === "DEALER" ? "DEALER" : "OWNER"}
      />
    </div>
  );
}
