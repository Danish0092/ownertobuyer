import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLoginForm } from "./AdminLoginForm";

// Deliberately outside the app/admin/(protected) route group and its
// layout guard, so this page itself never bounces through the
// authenticated-admin check. It does its own, opposite check instead:
// an already-authenticated visitor shouldn't see a login form at all.
export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    redirect(isAdmin ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[#F7F9FC] p-6">
      <AdminLoginForm />
    </div>
  );
}
