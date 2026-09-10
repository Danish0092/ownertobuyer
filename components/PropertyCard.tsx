"use client";

import { useRouter } from "next/navigation";

// Matches the real `PropertyCard` dc-import component from the Claude
// Design artifact (uuid 48b993b1 in the exported bundle) — badge
// color/gradient logic, photo-slot height, heart-save button, video
// badge, seller-initial avatar, and the WhatsApp + Call button pair
// are all reproduced from its source, not inferred.

export type PropertyCardData = {
  title: string;
  badgeText: string;
  areaLine: string;
  priceLabel: string;
  specsLine: string;
  sellerName: string;
  sellerTypeLabel: string;
  saved?: boolean;
  hasVideo?: boolean;
  photoUrl?: string | null;
  href: string;
  whatsappHref?: string;
  callHref?: string;
};

export function PropertyCard({ data }: { data: PropertyCardData }) {
  const router = useRouter();
  const isOwner = data.sellerTypeLabel.toLowerCase() === "owner";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(data.href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(data.href);
      }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#EAEFF6] bg-white font-body shadow-[0_4px_16px_rgba(16,24,40,0.10)]"
    >
      <div className="relative h-[190px] flex-none overflow-hidden bg-[#DDE8F5]">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed
          // Supabase Storage URLs expire, so next/image's remote-pattern
          // allowlist + long-lived caching don't fit here; a plain <img>
          // matches what PropertyDetail's gallery already does.
          <img src={data.photoUrl} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#8FA6C6]">
            No photo yet
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 font-display text-[11px] font-bold tracking-wide"
          style={
            isOwner
              ? { background: "linear-gradient(135deg,#22C55E,#14B8A6)", color: "#FFFFFF" }
              : { background: "#EEF2F7", color: "#475467" }
          }
        >
          {data.badgeText}
        </span>
        <button
          type="button"
          aria-label="Save property"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(16,24,40,0.18)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={data.saved ? "#EF4444" : "none"} stroke="#EF4444" strokeWidth={1.8}>
            <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4c2.2-.3 4 .9 6.4 3.4C14.4 4.9 16.2 3.7 18.4 4c3.6.5 5.2 4 3.6 7.7C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
        {data.hasVideo && (
          <div className="absolute bottom-2.5 right-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#0B2545]/72">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[7px] px-4 pb-4 pt-3.5">
        <div className="font-display text-[17px] font-bold leading-tight text-[#101828]">{data.title}</div>
        <div className="flex items-center gap-1 text-[12.5px] text-[#667085]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.2" />
          </svg>
          {data.areaLine}
        </div>
        <div className="font-display text-xl font-extrabold text-[#0B2545]">{data.priceLabel}</div>
        <div className="text-xs font-medium text-[#475467]">{data.specsLine}</div>
        <div className="mt-0.5 flex items-center gap-1.5 border-t border-[#F1F5F9] pt-2">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#E0ECFF] font-display text-[11px] font-bold text-[#2563EB]">
            {data.sellerName.charAt(0)}
          </span>
          <span className="text-[12.5px] font-medium text-[#344054]">
            {data.sellerName} <span className="text-[#98A2B3]">• {data.sellerTypeLabel}</span>
          </span>
        </div>
        <div className="mt-1.5 flex gap-2">
          <a
            href={data.whatsappHref ?? "#"}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#25D366] px-1.5 py-2.5 font-display text-[12.5px] font-bold text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.7 14.2c-.3.7-1.6 1.4-2.2 1.5-.6.1-1.2.2-3.7-.9-2.9-1.3-4.8-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.7-2.1.9-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.7.8 1.8.1.2.1.3 0 .5-.4.7-.8.9-1.1 1.2-.2.2-.3.4-.1.7.7 1.3 1.5 2.1 2.7 2.7.2.1.4.1.6-.1.3-.3.7-.9.9-1.2.2-.2.4-.2.6-.1.6.3 1.6.8 1.9.9.3.1.5.2.6.3.1.2.1.9-.2 1.5z" />
            </svg>
            WhatsApp
          </a>
          <a
            href={data.callHref ?? "#"}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#2563EB] bg-white px-1.5 py-2.5 font-display text-[12.5px] font-bold text-[#2563EB]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
              <path d="M3 5c0-1 1-2 2-2h2l2 5-2 1c1 3 3 5 6 6l1-2 5 2v2c0 1-1 2-2 2C9 19 3 13 3 5z" />
            </svg>
            Call
          </a>
        </div>
      </div>
    </div>
  );
}
