import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Shared shell for the static Company/Legal pages (About, Contact, FAQ,
// Terms, Privacy, Safety) so they read as one consistent set instead of
// six one-off layouts.
export function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 py-12">
        <h1 className="mb-2 font-display text-[28px] font-extrabold text-[#101828]">{title}</h1>
        {subtitle && <p className="mb-8 text-[15px] text-[#667085]">{subtitle}</p>}
        <div className="flex flex-col gap-6 text-[14.5px] leading-relaxed text-[#344054] [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#101828] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-[#2563EB] [&_a]:font-semibold">
          {children}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
