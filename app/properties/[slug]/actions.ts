"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReportReason } from "@/lib/report-reasons";

export async function submitReport(
  propertyId: string,
  reason: ReportReason
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to report a listing." };
  }

  const { error } = await supabase.from("property_reports").insert({
    property_id: propertyId,
    reporter_id: user.id,
    reason,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

// Logs that a buyer used a contact method on this property (feature
// #18, "seller contact tracking"). Fire-and-forget from the client —
// failures here shouldn't block the buyer's actual WhatsApp/Call
// action, so this never surfaces an error to the UI.
export async function logContact(propertyId: string, contactType: "WHATSAPP" | "CALL" | "CHAT") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("property_contacts").insert({
    property_id: propertyId,
    user_id: user?.id ?? null,
    contact_type: contactType,
  });
}
