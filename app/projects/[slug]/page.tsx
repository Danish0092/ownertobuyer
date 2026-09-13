import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { labelize } from "@/lib/property-options";
import { priceLabel, sizeRangeLabel } from "@/lib/format";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select(
      `id, developer_id, name, developer_name, description, address, approval_status, development_status,
       min_price, max_price, contact_name, contact_phone, status, created_at,
       cities(name), areas(name), societies(name),
       project_media(storage_path, media_type, is_primary, sort_order),
       project_inventory(id, property_type, size, size_unit, price_min, price_max, total_units, available_units, payment_plan)`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!project) notFound();
  // Same visibility rule as properties: the owner can always preview
  // their own draft/hidden project, nobody else can.
  if (project.status !== "PUBLISHED" && project.developer_id !== user?.id) notFound();

  const sortedMedia = [...project.project_media].sort((a, b) => a.sort_order - b.sort_order);
  const mediaUrls = await Promise.all(
    sortedMedia.slice(0, 6).map(async (m) => {
      const { data } = await supabase.storage.from("project-media").createSignedUrl(m.storage_path, 3600);
      return { url: data?.signedUrl ?? null, type: m.media_type };
    })
  );

  const isOwner = project.developer_id === user?.id;
  const location = [project.societies?.name, project.areas?.name, project.cities?.name].filter(Boolean).join(", ");
  const waNumber = project.contact_phone ? project.contact_phone.replace(/\D/g, "").replace(/^0/, "92") : "";
  const waMessage = encodeURIComponent(`Hi, I'm interested in ${project.name} on OwnerToBuyer.`);

  const DEV_STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
    PLANNING: { bg: "#F1F5F9", fg: "#475467" },
    UNDER_CONSTRUCTION: { bg: "#FFF7E6", fg: "#B45309" },
    PARTIALLY_COMPLETED: { bg: "#EFF6FF", fg: "#1D4ED8" },
    COMPLETED: { bg: "#DCFCE7", fg: "#15803D" },
    ON_HOLD: { bg: "#FEF2F2", fg: "#DC2626" },
  };
  const devStyle = DEV_STATUS_STYLE[project.development_status] ?? DEV_STATUS_STYLE.PLANNING;

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-16 font-body">
      <SiteHeader />

      {!isOwner ? null : (
        <div className="mx-auto w-full max-w-[1140px] px-6 pt-5">
          {project.status !== "PUBLISHED" && (
            <div className="mb-3 rounded-lg bg-[#FFF7E6] px-4 py-2.5 font-body text-[13px] font-semibold text-[#B45309]">
              This project is {labelize(project.status).toLowerCase()} — only you can see this page.
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={`/projects/${slug}/edit`}
              className="rounded-lg bg-[#EFF6FF] px-4 py-2 font-display text-[12.5px] font-bold text-[#1D4ED8]"
            >
              Edit Project
            </a>
            <a
              href={`/projects/${slug}/inventory`}
              className="rounded-lg bg-[#EFF6FF] px-4 py-2 font-display text-[12.5px] font-bold text-[#1D4ED8]"
            >
              Manage Inventory
            </a>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1140px] px-6 pt-5">
        {mediaUrls.length > 0 ? (
          <div className="mb-5 grid grid-cols-[2fr_1fr] gap-2.5 overflow-hidden rounded-2xl" style={{ maxHeight: 360 }}>
            {mediaUrls[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrls[0].url} alt={project.name} className="h-full w-full object-cover" />
            )}
            <div className="grid grid-rows-2 gap-2.5">
              {mediaUrls.slice(1, 3).map((m, i) =>
                m.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={m.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div key={i} className="bg-[#DDE8F5]" />
                )
              )}
            </div>
          </div>
        ) : (
          <div className="mb-5 flex h-[220px] items-center justify-center rounded-2xl bg-[#DDE8F5] text-sm text-[#8FA6C6]">
            No photos yet
          </div>
        )}

        <div className="flex flex-wrap gap-8">
          <div className="min-w-[320px] flex-[2]">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1.5 font-display text-[11px] font-extrabold"
                style={{ background: devStyle.bg, color: devStyle.fg }}
              >
                {labelize(project.development_status)}
              </span>
            </div>
            <h1 className="mb-1 font-display text-2xl font-extrabold text-[#0B2545]">{project.name}</h1>
            <p className="mb-1 text-sm text-[#667085]">{location || "Lahore"}</p>
            <p className="mb-4 text-sm font-semibold text-[#344054]">by {project.developer_name}</p>

            {(project.min_price || project.max_price) && (
              <div className="mb-5 font-display text-xl font-extrabold text-[#0B2545]">
                Starting from{" "}
                {project.min_price ? priceLabel(project.min_price, "TOTAL") : priceLabel(project.max_price!, "TOTAL")}
              </div>
            )}

            {project.description && (
              <p className="mb-6 whitespace-pre-wrap text-[14.5px] leading-relaxed text-[#344054]">
                {project.description}
              </p>
            )}

            <div className="mb-6 rounded-xl bg-[#F8FAFC] p-4 text-[13px] text-[#475467]">
              <span className="font-bold text-[#344054]">Approval / authority status: </span>
              {labelize(project.approval_status)}
              <p className="mt-1 text-[11.5px] text-[#98A2B3]">
                Developer-provided information — not independently verified by the platform.
              </p>
            </div>

            <h2 className="mb-3 font-display text-lg font-bold text-[#101828]">Project Inventory</h2>
            {project.project_inventory.length > 0 ? (
              <div className="mb-8 flex flex-col gap-3">
                {project.project_inventory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#EAEFF6] bg-white p-4">
                    <div className="font-display text-sm font-bold text-[#101828]">
                      {labelize(item.property_type)}
                      {sizeRangeLabel(item.size, item.size, item.size_unit) &&
                        ` · ${sizeRangeLabel(item.size, item.size, item.size_unit)}`}
                    </div>
                    <div className="text-[13.5px] text-[#667085]">
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
                    {item.payment_plan && <div className="mt-1.5 text-xs text-[#98A2B3]">{item.payment_plan}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-8 text-sm text-[#98A2B3]">No unit types listed yet.</p>
            )}
          </div>

          <div className="min-w-[280px] flex-1">
            <div className="rounded-[18px] border border-[#EAEFF6] bg-white p-5.5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
              <div className="mb-3 font-display text-xs font-extrabold text-[#0F766E]">CONTACT DEVELOPER</div>
              <div className="mb-4 font-display font-bold text-[#101828]">
                {project.contact_name || project.developer_name}
              </div>
              {project.contact_phone ? (
                <div className="flex flex-col gap-2.5">
                  <a
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#25D366] py-3.5 text-center font-display text-sm font-extrabold text-white"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${project.contact_phone}`}
                    className="rounded-xl bg-[#2563EB] py-3.5 text-center font-display text-sm font-extrabold text-white"
                  >
                    Call
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[#98A2B3]">No contact number provided yet.</p>
              )}
              <p className="mt-3.5 text-center text-[11px] text-[#98A2B3]">
                Verify all project information independently before making any payment.
              </p>
            </div>

            <div className="mt-4.5 rounded-2xl border border-[#FDE9B8] bg-[#FFF9EB] p-4.5">
              <div className="mb-1.5 font-display text-[13px] font-extrabold text-[#B45309]">Important</div>
              <p className="m-0 text-[12.5px] leading-relaxed text-[#8A5A0A]">
                OwnerToBuyer is a connection platform, not a developer, broker, or verification service. We do not
                verify project approvals, ownership, or the accuracy of information provided by the developer/society.
                Verify all details independently before making any payment.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
