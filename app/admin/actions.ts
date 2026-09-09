"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string } | { ok: true };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, isAdmin: !!isAdmin };
}

export async function toggleUserBlock(userId: string, currentlyBlocked: boolean): Promise<Result> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Admin access required." };

  const { error } = await supabase.from("profiles").update({ is_blocked: !currentlyBlocked }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function togglePropertyHide(propertyId: string, currentStatus: string): Promise<Result> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Admin access required." };

  const nextStatus = currentStatus === "HIDDEN" ? "PUBLISHED" : "HIDDEN";
  const { error } = await supabase.from("properties").update({ status: nextStatus }).eq("id", propertyId);
  if (error) return { error: error.message };

  revalidatePath("/admin/properties");
  return { ok: true };
}

export async function dismissReport(reportId: string): Promise<Result> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Admin access required." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("property_reports")
    .update({ status: "DISMISSED", admin_id: user?.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function hideListingFromReport(reportId: string, propertyId: string): Promise<Result> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Admin access required." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [propertyResult, reportResult] = await Promise.all([
    supabase.from("properties").update({ status: "HIDDEN" }).eq("id", propertyId),
    supabase
      .from("property_reports")
      .update({ status: "RESOLVED", admin_id: user?.id, resolved_at: new Date().toISOString() })
      .eq("id", reportId),
  ]);

  if (propertyResult.error) return { error: propertyResult.error.message };
  if (reportResult.error) return { error: reportResult.error.message };

  revalidatePath("/admin/reports");
  revalidatePath("/admin/properties");
  return { ok: true };
}
