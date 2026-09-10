import { createClient } from "@/lib/supabase/server";

const COLORS = ["#2563EB", "#0D9488", "#F59E0B", "#DC2626", "#22C55E", "#7C3AED", "#0B2545", "#EA580C"];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: publishedCount },
    { count: openReports },
    { count: blockedUsers },
    { data: viewsAndContacts },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }).neq("status", "DELETED"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
    supabase.from("property_reports").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("properties").select("views_count, contact_count").neq("status", "DELETED"),
  ]);

  const totalViews = (viewsAndContacts ?? []).reduce((sum, p) => sum + (p.views_count ?? 0), 0);
  const totalContacts = (viewsAndContacts ?? []).reduce((sum, p) => sum + (p.contact_count ?? 0), 0);

  const metrics = [
    { label: "Total Users", value: totalUsers ?? 0 },
    { label: "Total Properties", value: totalProperties ?? 0 },
    { label: "Published Listings", value: publishedCount ?? 0 },
    { label: "Open Reports", value: openReports ?? 0 },
    { label: "Blocked Users", value: blockedUsers ?? 0 },
    { label: "Total Views", value: totalViews },
    { label: "Total Contacts", value: totalContacts },
  ];

  return (
    <div>
      <h2 className="mb-4.5 font-display text-xl font-bold text-[#101828]">Dashboard</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="rounded-2xl bg-white p-4.5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
            style={{ borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}
          >
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#98A2B3]">{m.label}</div>
            <div className="font-display text-2xl font-extrabold text-[#101828]">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
