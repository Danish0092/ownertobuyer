"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PurposeTabs } from "@/components/PurposeTabs";
import { SearchBar } from "@/components/SearchBar";

// The only part of the Home hero that needs client-side state (the
// Buy/Rent toggle + text field) — everything else on the page stays a
// plain server-rendered link.
export function HeroSearch() {
  const router = useRouter();
  const [purpose, setPurpose] = useState<"SALE" | "RENT">("SALE");
  const [q, setQ] = useState("");

  function submit() {
    const params = new URLSearchParams();
    if (purpose !== "SALE") params.set("purpose", purpose);
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="mt-4.5 w-full max-w-[760px] rounded-[20px] bg-white p-4.5 text-left shadow-[0_20px_50px_rgba(6,20,40,0.35)]">
      <div className="mb-3.5">
        <PurposeTabs value={purpose} onChange={setPurpose} variant="light" />
      </div>
      <SearchBar value={q} onChange={setQ} onSubmit={submit} />
    </div>
  );
}
