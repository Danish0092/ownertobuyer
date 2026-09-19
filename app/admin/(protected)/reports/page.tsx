import { createClient } from "@/lib/supabase/server";
import { ReportActions } from "./ReportActions";

const th = "px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#98A2B3]";
const td = "whitespace-nowrap px-3.5 py-3 text-[#344054]";

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "#FFF7E6", fg: "#B45309" },
  UNDER_REVIEW: { bg: "#EFF6FF", fg: "#1D4ED8" },
  RESOLVED: { bg: "#DCFCE7", fg: "#15803D" },
  DISMISSED: { bg: "#F1F5F9", fg: "#475467" },
};

function label(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("property_reports")
    .select("id, reason, status, created_at, reporter_id, properties(id, title)")
    .order("created_at", { ascending: false });

  // property_reports.reporter_id references auth.users, not profiles
  // directly, so PostgREST can't embed profiles in the query above —
  // fetched separately and merged here instead.
  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id).filter((id): id is string => !!id))];
  const { data: reporters } =
    reporterIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", reporterIds)
      : { data: [] };
  const reporterNames = new Map((reporters ?? []).map((r) => [r.id, r.full_name]));

  return (
    <div>
      <h2 className="mb-4.5 font-display text-xl font-bold text-[#101828]">Reports</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className={th}>Property</th>
              <th className={th}>Reporter</th>
              <th className={th}>Reason</th>
              <th className={th}>Date</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map((r) => {
              const style = STATUS_STYLE[r.status] ?? STATUS_STYLE.OPEN;
              return (
                <tr key={r.id} className="border-t border-[#F1F5F9]">
                  <td className={td}>{r.properties?.title ?? "(deleted)"}</td>
                  <td className={td}>{(r.reporter_id && reporterNames.get(r.reporter_id)) ?? "—"}</td>
                  <td className={td}>{label(r.reason)}</td>
                  <td className={td}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className={td}>
                    <span
                      className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {label(r.status)}
                    </span>
                  </td>
                  <td className={td}>
                    {r.status === "OPEN" && r.properties?.id && (
                      <ReportActions reportId={r.id} propertyId={r.properties.id} />
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
