"use client";

import { logContact } from "@/app/properties/[slug]/actions";

// WhatsApp/Call actions on a property's contact card. Both
// WhatsApp and Call need the seller's phone number — which nothing in
// the app currently collects (no profile-edit page exists yet), so
// they degrade to a disabled, explained state rather than a dead
// link when it's missing.
export function ContactButtons({
  propertyId,
  propertyTitle,
  phoneNumber,
}: {
  propertyId: string;
  propertyTitle: string;
  phoneNumber: string | null;
}) {
  const hasPhone = !!phoneNumber;
  // Assumes a Pakistani number; strips everything but digits and a
  // leading 0 becomes the 92 country code for wa.me's required format.
  const waNumber = phoneNumber ? phoneNumber.replace(/\D/g, "").replace(/^0/, "92") : "";
  const waMessage = encodeURIComponent(`Hi, I am interested in your property "${propertyTitle}" on OwnerToBuyer.`);

  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={hasPhone ? `https://wa.me/${waNumber}?text=${waMessage}` : undefined}
        target={hasPhone ? "_blank" : undefined}
        rel="noreferrer"
        onClick={() => hasPhone && logContact(propertyId, "WHATSAPP")}
        aria-disabled={!hasPhone}
        className="flex items-center justify-center gap-2 rounded-xl border-none py-3.5 font-display text-sm font-extrabold text-white"
        style={{ background: hasPhone ? "#25D366" : "#CBD5E1", cursor: hasPhone ? "pointer" : "not-allowed" }}
      >
        WhatsApp
      </a>
      <a
        href={hasPhone ? `tel:${phoneNumber}` : undefined}
        onClick={() => hasPhone && logContact(propertyId, "CALL")}
        aria-disabled={!hasPhone}
        className="rounded-xl py-3.5 text-center font-display text-sm font-extrabold text-white"
        style={{ background: hasPhone ? "#2563EB" : "#CBD5E1", cursor: hasPhone ? "pointer" : "not-allowed" }}
      >
        Call
      </a>
      {!hasPhone && (
        <p className="text-center text-[11px] text-[#98A2B3]">
          Seller hasn&apos;t added a phone number yet.
        </p>
      )}
    </div>
  );
}
