"use client";

// The buyer-side equivalent of ContactButtons (components/ContactButtons.tsx).
// Same degrade-gracefully-without-a-phone pattern; no separate contact-log
// table for this direction yet (property_contacts is keyed to a property,
// not a requirement), so this doesn't log anything — just opens the channel.
export function ContactBuyerButtons({
  buyerName,
  phoneNumber,
  requirementTitle,
}: {
  buyerName: string;
  phoneNumber: string | null;
  requirementTitle: string;
}) {
  const hasPhone = !!phoneNumber;
  const waNumber = phoneNumber ? phoneNumber.replace(/\D/g, "").replace(/^0/, "92") : "";
  const waMessage = encodeURIComponent(
    `Hi ${buyerName}, I saw your requirement for "${requirementTitle}" on OwnerToBuyer — I have a property that matches.`
  );

  if (!hasPhone) {
    return <p className="font-body text-[12px] text-[#98A2B3]">This buyer hasn&apos;t added a phone number yet.</p>;
  }

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/${waNumber}?text=${waMessage}`}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 font-display text-[12.5px] font-bold text-white"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${phoneNumber}`}
        className="flex-1 rounded-lg bg-[#2563EB] py-2.5 text-center font-display text-[12.5px] font-bold text-white"
      >
        Call
      </a>
    </div>
  );
}
