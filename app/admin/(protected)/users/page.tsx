import { createClient } from "@/lib/supabase/server";
import { labelize } from "@/lib/property-options";
import { SuspendButton } from "./SuspendButton";

const th = "px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#98A2B3]";
const td = "px-3.5 py-3 text-[#344054]";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: properties }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone_number, account_type, is_blocked, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("seller_id").neq("status", "DELETED"),
  ]);

  const listingCounts = new Map<string, number>();
  for (const p of properties ?? []) {
    listingCounts.set(p.seller_id, (listingCounts.get(p.seller_id) ?? 0) + 1);
  }

  return (
    <div>
      <h2 className="mb-4.5 font-display text-xl font-bold text-[#101828]">Users</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className={th}>Name</th>
              <th className={th}>Phone</th>
              <th className={th}>Type</th>
              <th className={th}>Listings</th>
              <th className={th}>Status</th>
              <th className={th}>Joined</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((u) => (
              <tr key={u.id} className="border-t border-[#F1F5F9]">
                <td className={td}>{u.full_name}</td>
                <td className={td}>{u.phone_number ?? "—"}</td>
                <td className={td}>{labelize(u.account_type)}</td>
                <td className={td}>{listingCounts.get(u.id) ?? 0}</td>
                <td className={td}>
                  <span
                    className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                    style={
                      u.is_blocked
                        ? { background: "#FEF2F2", color: "#DC2626" }
                        : { background: "#DCFCE7", color: "#15803D" }
                    }
                  >
                    {u.is_blocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className={td}>{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                <td className={td}>
                  <SuspendButton userId={u.id} isBlocked={u.is_blocked} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
