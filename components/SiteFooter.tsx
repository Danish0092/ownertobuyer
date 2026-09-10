// Shared site footer — used on Home, Search, and PropertyDetail. Extracted
// from app/page.tsx so the legal/company links go to real pages everywhere
// instead of only working from the homepage.
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-gradient-to-b from-[#0B2545] via-[#123A63] to-[#0F2E52] px-7 pt-14 text-[#E7ECF5]">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="mb-2.5 font-display text-xl font-extrabold text-white">
              OwnerTo<span className="text-[#F59E0B]">Buyer</span>
            </div>
            <p className="mb-4.5 max-w-[280px] text-[13px] leading-relaxed text-[#AEC2E0]">
              Lahore&apos;s owner-direct property marketplace. Buy Direct. Sell Free. Connect with property owners and
              dealers without unnecessary middlemen.
            </p>
            <a
              href="/properties/new"
              className="inline-block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5.5 py-3 font-display text-[13px] font-extrabold text-white shadow-[0_6px_16px_rgba(245,158,11,0.3)]"
            >
              Post Property FREE
            </a>
            <div className="mt-5.5 flex gap-2.5">
              {["f", "in", "ig", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 text-[13px] text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Explore"
            links={[
              { label: "Buy", href: "/search?purpose=SALE" },
              { label: "Rent", href: "/search?purpose=RENT" },
              { label: "Owner Direct", href: "/search?seller=OWNER" },
              { label: "Property Videos", href: "#" },
              { label: "Post Property", href: "/properties/new" },
            ]}
          />
          <FooterCol
            title="Popular Lahore Areas"
            links={["DHA Lahore", "Bahria Town", "Gulberg", "Johar Town"].map((label) => ({
              label,
              href: `/search?q=${encodeURIComponent(label)}`,
            }))}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Help / FAQ", href: "/faq" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Terms & Conditions", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Safety / Disclaimer", href: "/safety" },
            ]}
          />
        </div>
        <div className="mt-10 border-t border-white/10 py-5 text-center text-xs text-[#8FA5C7]">
          © 2026 OwnerToBuyer. All rights reserved. A connection platform — not a real estate agency, broker or
          verification service.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="mb-3.5 font-display text-[13px] font-bold uppercase tracking-wide text-[#7DD3C0]">{title}</div>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="text-[13.5px] text-[#D6E0F0]">
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
