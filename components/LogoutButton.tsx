import { logoutAction } from "@/app/logout/actions";

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

// "icon": round icon-only button for the mobile header.
// "text": icon + label, for the desktop header and the mobile drawer.
export function LogoutButton({ variant, className = "" }: { variant: "icon" | "text"; className?: string }) {
  return (
    <form action={logoutAction} className={className}>
      {variant === "icon" ? (
        <button
          type="submit"
          aria-label="Log out"
          title="Log out"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#E4E9F2] bg-white text-[#667085] hover:text-[#DC2626]"
        >
          <LogoutIcon />
        </button>
      ) : (
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#E4E9F2] px-4 py-2.5 font-display text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2]"
        >
          <LogoutIcon />
          Log out
        </button>
      )}
    </form>
  );
}
