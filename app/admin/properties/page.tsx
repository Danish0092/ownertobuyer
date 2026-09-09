import { createClient } from "@/lib/supabase/server";
import { labelize } from "@/lib/property-options";
import { priceLabel, areaLine } from "@/lib/format";
import { HideButton } from "./HideButton";

const th = "px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#98A2B3]";
const td = "px-3.5 py-3 text-[#344054]";

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PUBLISHED: { bg: "#DCFCE7", fg: "#15803D" },
  DRAFT: { bg: "#FFF7E6", fg: "#B45309" },
  PENDING_REVIEW: { bg: "#FFF7E6", fg: "#B45309" },
  HIDDEN: { bg: "#F1F5F9", fg: "#475467" },
  REJECTED: { bg: "#FEF2F2", fg: "#DC2626" },
};
const DEFAULT_STATUS_STYLE = { bg: "#F1F5F9", fg: "#475467" };

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, title, price, price_type, property_type, seller_type, status, views_count, cities(name), areas(name), societies(name), profiles(full_name)"
    )
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="mb-4.5 font-display text-xl font-bold text-[#101828]">Properties</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className={th}>Property</th>
              <th className={th}>Seller</th>
              <th className={th}>Location</th>
              <th className={th}>Price</th>
              <th className={th}>Type</th>
              <th className={th}>Views</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(properties ?? []).map((p) => {
              const style = STATUS_STYLE[p.status] ?? DEFAULT_STATUS_STYLE;
              return (
                <tr key={p.id} className="border-t border-[#F1F5F9]">
                  <td className={td}>{p.title}</td>
                  <td className={td}>
                    {p.profiles?.full_name}{" "}
                    <span
                      className="ml-1 rounded-full px-2 py-0.5 font-display text-[10px] font-bold"
                      style={
                        p.seller_type === "OWNER"
                          ? { background: "#DCFCE7", color: "#15803D" }
                          : { background: "#F1F5F9", color: "#475467" }
                      }
                    >
                      {labelize(p.seller_type)}
                    </span>
                  </td>
                  <td className={td}>{areaLine(p.societies?.name, p.areas?.name, p.cities?.name)}</td>
                  <td className={td}>{priceLabel(p.price, p.price_type)}</td>
                  <td className={td}>{labelize(p.property_type)}</td>
                  <td className={td}>{p.views_count}</td>
                  <td className={td}>
                    <span
                      className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {labelize(p.status)}
                    </span>
                  </td>
                  <td className={td}>
                    {(p.status === "PUBLISHED" || p.status === "HIDDEN") && (
                      <HideButton propertyId={p.id} status={p.status} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
