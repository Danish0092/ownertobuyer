import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RequirementForm } from "./RequirementForm";
import { createRequirement } from "./actions";

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
        <RequirementForm
          cityId={city?.id ?? ""}
          cityName={city?.name ?? "Lahore"}
          areas={areas ?? []}
          societies={societies ?? []}
          action={createRequirement}
          successView={
            <div className="mx-auto w-full max-w-[560px] rounded-2xl bg-white p-8 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7] text-2xl">
                ✓
              </div>
              <h2 className="mb-2 font-display text-lg font-bold text-[#101828]">Requirement posted</h2>
              <p className="mb-6 font-body text-sm text-[#667085]">
                We&apos;ll match it against live listings automatically and notify you the moment a strong match
                shows up — no need to keep searching yourself.
              </p>
              <div className="flex justify-center gap-2.5">
                <a
                  href="/requirements"
                  className="inline-block rounded-lg bg-[#0B2545] px-5 py-2.5 font-display text-sm font-bold text-white"
                >
                  View My Requirements
                </a>
                <a
                  href="/search"
                  className="inline-block rounded-lg bg-[#F1F5F9] px-5 py-2.5 font-display text-sm font-bold text-[#475467]"
                >
                  Browse properties
                </a>
              </div>
            </div>
          }
        />
      </div>
      <SiteFooter />
    </div>
  );
}
