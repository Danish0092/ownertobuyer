import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/property-options";
import { SuspendButton } from "./SuspendButton";

const th = "px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#98A2B3]";
const td = "whitespace-nowrap px-3.5 py-3 text-[#344054]";

const TYPE_BADGE: Record<AccountType, { label: string; bg: string; fg: string }> = {
  BUYER: { label: "BUYER", bg: "#EFF6FF", fg: "#1D4ED8" },
  OWNER: { label: "SELLER", bg: "#FEF3C7", fg: "#B45309" },
  DEALER: { label: "DEALER", bg: "#F3E8FF", fg: "#7C3AED" },
  DEVELOPER: { label: "DEVELOPER", bg: "#CCFBF1", fg: "#0F766E" },
};

const FILTERS: { value: AccountType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BUYER", label: "Buyer" },
  { value: "OWNER", label: "Seller" },
  { value: "DEALER", label: "Dealer" },
  { value: "DEVELOPER", label: "Developer" },
];

function usersHref(type: string, q: string) {
  const params = new URLSearchParams();
  if (type !== "ALL") params.set("type", type);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const type = ACCOUNT_TYPES.includes(sp.type as AccountType) ? (sp.type as AccountType) : "ALL";
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();

  const [{ data: profiles }, { data: properties }, { data: emailRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone_number, account_type, is_blocked, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("seller_id").neq("status", "DELETED"),
    supabase.rpc("admin_user_emails"),
  ]);

  const emailById = new Map<string, string>(
    ((emailRows ?? []) as { id: string; email: string }[]).map((r) => [r.id, r.email])
  );

  const listingCounts = new Map<string, number>();
  for (const p of properties ?? []) {
    listingCounts.set(p.seller_id, (listingCounts.get(p.seller_id) ?? 0) + 1);
  }

  const all = profiles ?? [];
  const counts: Record<string, number> = { ALL: all.length };
  for (const u of all) counts[u.account_type] = (counts[u.account_type] ?? 0) + 1;

  const needle = q.toLowerCase();
  const users = all.filter((u) => {
    if (type !== "ALL" && u.account_type !== type) return false;
    if (!needle) return true;
    return (
      u.full_name?.toLowerCase().includes(needle) ||
      (u.phone_number ?? "").toLowerCase().includes(needle) ||
      (emailById.get(u.id) ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <div>
      <h2 className="mb-4.5 font-display text-xl font-bold text-[#101828]">Users</h2>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        {FILTERS.map((f) => {
          const active = type === f.value;
          return (
            <a
              key={f.value}
              href={usersHref(f.value, q)}
              className={`rounded-full px-3.5 py-2 font-display text-[12.5px] font-bold ${
                active ? "bg-[#0B2545] text-white" : "border border-[#E4E9F2] bg-white text-[#475467]"
              }`}
            >
              {f.label} <span className="opacity-70">({counts[f.value] ?? 0})</span>
            </a>
          );
        })}
        <form action="/admin/users" className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          {type !== "ALL" && <input type="hidden" name="type" value={type} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone"
            className="min-w-0 flex-1 rounded-[10px] sm:w-[240px] sm:flex-none border border-[#E4E9F2] bg-white px-3 py-2 text-[13px] outline-none"
          />
          <button
            type="submit"
            className="rounded-[10px] bg-[#0B2545] px-3.5 py-2 font-display text-[12.5px] font-bold text-white"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className={th}>Name</th>
              <th className={th}>Email</th>
              <th className={th}>Phone</th>
              <th className={th}>Type</th>
              <th className={th}>Listings</th>
              <th className={th}>Status</th>
              <th className={th}>Joined</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const badge = TYPE_BADGE[u.account_type as AccountType];
              return (
                <tr key={u.id} className="border-t border-[#F1F5F9]">
                  <td className={td}>{u.full_name}</td>
                  <td className={td}>{emailById.get(u.id) ?? "—"}</td>
                  <td className={td}>{u.phone_number ?? "—"}</td>
                  <td className={td}>
                    {badge ? (
                      <span
                        title={ACCOUNT_TYPE_LABELS[u.account_type as AccountType]}
                        className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-[#98A2B3]">Not set</span>
                    )}
                  </td>
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
                  <td className={td}>
                    {new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className={td}>
                    <SuspendButton userId={u.id} isBlocked={u.is_blocked} />
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3.5 py-8 text-center text-[#98A2B3]">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
