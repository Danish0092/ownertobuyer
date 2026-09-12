import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RequirementForm } from "./RequirementForm";

export default async function NewRequirementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Single-city platform for now, same as the property posting flow.
  const { data: city } = await supabase.from("cities").select("id, name").eq("slug", "lahore").single();

  const [{ data: areas }, { data: societies }] = await Promise.all([
    supabase.from("areas").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
    supabase.from("societies").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 py-10">
        <div className="mb-7 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-[#0B2545]">
            Tell us what you&apos;re looking for
          </h1>
          <p className="mx-auto max-w-[480px] font-body text-sm text-[#667085]">
            Owner ke paas property hai, buyer ke paas requirement hai — OwnerToBuyer dono ko match karta hai. Post
            your requirement and we&apos;ll alert you the moment a matching listing goes live.
          </p>
        </div>
        <RequirementForm cityId={city?.id ?? ""} cityName={city?.name ?? "Lahore"} areas={areas ?? []} societies={societies ?? []} />
      </div>
      <SiteFooter />
    </div>
  );
}
