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

  // Top bar with scrollable tabs below `lg`, fixed left sidebar from `lg` up.
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F7F9FC] font-body lg:flex-row">
      <div className="flex flex-none flex-col gap-2 bg-[#0B2545] p-3 lg:w-[210px] lg:gap-1 lg:p-3.5">
        <div className="flex items-center justify-between lg:mb-4 lg:block">
          <div className="font-display text-base font-extrabold text-white">
            OwnerToBuyer <span className="text-xs font-bold text-[#7DD3C0]">Admin</span>
          </div>
          <a
            href="/dashboard"
            className="rounded-[10px] px-2 py-1.5 font-display text-[12.5px] font-bold text-[#9FB4D6] lg:hidden"
          >
            ← Exit
          </a>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex-none whitespace-nowrap rounded-[10px] px-3 py-2.5 font-display text-[13px] font-bold text-[#9FB4D6] hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="/dashboard"
          className="mt-auto hidden rounded-[10px] px-3 py-2.5 text-left font-display text-[12.5px] font-bold text-[#9FB4D6] lg:block"
        >
          ← Exit Admin
        </a>
      </div>
      <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-7">{children}</div>
    </div>
  );
}
