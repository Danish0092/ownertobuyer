import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyForm } from "./PropertyForm";

export default async function NewPropertyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: cities }, { data: areas }, { data: societies }, { data: amenities }, { data: profile }] =
    await Promise.all([
      supabase.from("cities").select("id, name").order("name"),
      supabase.from("areas").select("id, city_id, name").order("name"),
      supabase.from("societies").select("id, city_id, name").order("name"),
      supabase.from("amenities").select("id, name, category").order("name"),
      supabase.from("profiles").select("account_type").eq("id", user.id).single(),
    ]);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-2xl py-12 px-6">
        <h1 className="mb-1 text-2xl font-semibold text-black dark:text-zinc-50">
          Post a property
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          Fields marked with a claim notice (e.g. authority/NOC status)
          reflect what the seller told us — OwnerToBuyer does not verify
          property documents, approvals, or ownership. Buyers must do
          their own due diligence with the relevant authorities.
        </p>
        <PropertyForm
          cities={cities ?? []}
          areas={areas ?? []}
          societies={societies ?? []}
          amenities={amenities ?? []}
          defaultSellerType={profile?.account_type ?? "OWNER"}
        />
      </main>
    </div>
  );
}
