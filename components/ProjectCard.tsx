// Buyer-facing card for a Developer/Society project — the project
// equivalent of PropertyCard, used on /projects and the homepage's
// featured-projects section. Simpler than PropertyCard: no save/
// contact buttons, since a project isn't a single listing a buyer
// contacts directly the same way (see the project detail page for
// that).

export type ProjectCardData = {
  name: string;
  developerName: string;
  locationLine: string;
  priceLabel: string | null;
  developmentStatusLabel: string;
  photoUrl?: string | null;
  href: string;
};

const DEV_STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Planning: { bg: "#F1F5F9", fg: "#475467" },
  "Under Construction": { bg: "#FFF7E6", fg: "#B45309" },
  "Partially Completed": { bg: "#EFF6FF", fg: "#1D4ED8" },
  Completed: { bg: "#DCFCE7", fg: "#15803D" },
  "On Hold": { bg: "#FEF2F2", fg: "#DC2626" },
};

export function ProjectCard({ data }: { data: ProjectCardData }) {
  const style = DEV_STATUS_STYLE[data.developmentStatusLabel] ?? DEV_STATUS_STYLE.Planning;

  return (
    <a
      href={data.href}
      className="flex flex-col overflow-hidden rounded-[18px] border border-[#EAEFF6] bg-white font-body shadow-[0_4px_16px_rgba(16,24,40,0.10)]"
    >
      <div className="relative h-[160px] flex-none overflow-hidden bg-[#DDE8F5]">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt={data.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[#8FA6C6]">
            No photo yet
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 font-display text-[11px] font-bold tracking-wide"
          style={{ background: style.bg, color: style.fg }}
        >
          {data.developmentStatusLabel}
        </span>
      </div>
      <div className="flex flex-col gap-[5px] px-4 pb-4 pt-3.5">
        <div className="font-display text-[16px] font-bold leading-tight text-[#101828]">{data.name}</div>
        <div className="text-[12.5px] text-[#667085]">{data.locationLine}</div>
        <div className="text-xs font-medium text-[#475467]">by {data.developerName}</div>
        {data.priceLabel && (
          <div className="mt-1 font-display text-[15px] font-extrabold text-[#0B2545]">
            Starting from {data.priceLabel}
          </div>
        )}
      </div>
    </a>
  );
}
