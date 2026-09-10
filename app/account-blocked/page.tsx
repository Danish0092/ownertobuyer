export default function AccountBlockedPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-[0_6px_18px_rgba(16,24,40,0.08)]">
        <h1 className="mb-2 font-display text-xl font-bold text-[#DC2626]">Account blocked</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Your account has been blocked by an administrator and you&rsquo;ve been signed out. If you believe this is a
          mistake, please contact support.
        </p>
        <a
          href="/"
          className="inline-block rounded-lg bg-[#0B2545] px-4 py-2.5 font-display text-sm font-bold text-white"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
