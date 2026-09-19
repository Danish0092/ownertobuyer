"use client";

import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/nav-config";
import { LogoutButton } from "@/components/LogoutButton";

// Hamburger + slide-in drawer shown below the `lg` breakpoint, where the
// desktop nav in SiteHeader is hidden. Items are passed in from the server
// header so the drawer always reflects the signed-in user's role.
export function MobileNav({
  items,
  cta,
  signedIn,
}: {
  items: NavItem[];
  cta: { label: string; href: string };
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#E4E9F2] bg-white text-[#0B2545]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-[#0B2545]/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-[70] flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-[8px_0_24px_rgba(16,24,40,0.12)] transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#EAEFF6] px-5 py-4">
          <span className="font-display text-[17px] font-extrabold text-[#0B2545]">
            OwnerTo<span className="text-[#F59E0B]">Buyer</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#667085]"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
          {items.map((item) =>
            item.disabled ? (
              <span key={item.label} className="rounded-lg px-3 py-3 font-body text-[15px] text-[#98A2B3]">
                {item.label}
              </span>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-body text-[15px] text-[#344054] hover:bg-[#F1F5F9]"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-[#EAEFF6] p-4">
          <a
            href={cta.href}
            className="rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-4 py-3 text-center font-display text-[13px] font-extrabold text-white"
          >
            {cta.label}
          </a>
          <a
            href={signedIn ? "/profile" : "/login"}
            className="rounded-[10px] border border-[#E4E9F2] px-4 py-3 text-center font-display text-[13px] font-bold text-[#344054]"
          >
            {signedIn ? "My Profile" : "Log In / Sign Up"}
          </a>
          {signedIn && <LogoutButton variant="text" />}
        </div>
      </aside>
    </div>
  );
}
