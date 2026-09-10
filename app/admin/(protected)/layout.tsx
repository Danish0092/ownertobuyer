import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 bg-[#F7F9FC] font-body">
      <div className="flex w-[210px] flex-none flex-col gap-1 bg-[#0B2545] p-3.5">
        <div className="mb-4 font-display text-base font-extrabold text-white">
          OwnerToBuyer <span className="text-xs font-bold text-[#7DD3C0]">Admin</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-[10px] px-3 py-2.5 font-display text-[13px] font-bold text-[#9FB4D6] hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </a>
        ))}
        <a
          href="/dashboard"
          className="mt-auto rounded-[10px] px-3 py-2.5 text-left font-display text-[12.5px] font-bold text-[#9FB4D6]"
        >
          ← Exit Admin
        </a>
      </div>
      <div className="flex-1 overflow-auto p-7">{children}</div>
    </div>
  );
}
