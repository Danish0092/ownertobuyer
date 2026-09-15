import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { labelize } from "@/lib/property-options";
import { priceLabel, sizeRangeLabel } from "@/lib/format";
import { getAccountType } from "@/lib/auth-roles";
import { AddInventoryForm } from "./AddInventoryForm";
import { InventoryRowActions } from "./InventoryRowActions";

export default async function ProjectInventoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, developer_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) notFound();
  if (project.developer_id !== user.id) redirect(`/projects/${slug}`);

  const accountType = await getAccountType(supabase, user.id);
  if (accountType !== "DEVELOPER") redirect("/dashboard");

  const { data: inventory } = await supabase
    .from("project_inventory")
    .select("id, property_type, size, size_unit, price_min, price_max, total_units, available_units, payment_plan")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-10 font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 pt-8">
        <div className="mb-1 flex items-center gap-2.5">
          <a href="/dashboard" className="font-body text-sm text-[#667085] hover:text-[#0B2545]">
            My Projects
          </a>
          <span className="text-[#98A2B3]">/</span>
          <span className="font-body text-sm font-semibold text-[#0B2545]">{project.name}</span>
        </div>
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Project Inventory</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Unit types, sizes, and pricing shown on {project.name}&apos;s public page.
        </p>

        {inventory && inventory.length > 0 && (
          <div className="mb-5 flex flex-col gap-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EAEFF6] bg-white p-4 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
              >
                <div>
                  <div className="font-display text-sm font-bold text-[#101828]">
                    {labelize(item.property_type)}
                    {sizeRangeLabel(item.size, item.size, item.size_unit) &&
                      ` · ${sizeRangeLabel(item.size, item.size, item.size_unit)}`}
                  </div>
                  <div className="text-[13px] text-[#667085]">
                    {item.price_max
                      ? `${priceLabel(item.price_min, "TOTAL")} – ${priceLabel(item.price_max, "TOTAL").replace("PKR ", "")}`
                      : priceLabel(item.price_min, "TOTAL")}
                    {item.total_units != null && (
                      <>
                        {" · "}
                        {item.available_units ?? item.total_units} / {item.total_units} available
                      </>
                    )}
                  </div>
                  {item.payment_plan && <div className="mt-1 text-xs text-[#98A2B3]">{item.payment_plan}</div>}
                </div>
                <InventoryRowActions itemId={item.id} projectSlug={slug} />
              </div>
            ))}
          </div>
        )}

        <AddInventoryForm projectSlug={slug} />
      </div>
      <SiteFooter />
    </div>
  );
}
