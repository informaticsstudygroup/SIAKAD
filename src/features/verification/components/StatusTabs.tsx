"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";

const TABS = [
  { value: "PENDING", label: "Menunggu" },
  { value: "VERIFIED", label: "Terverifikasi" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "REVISION_REQUIRED", label: "Perlu Revisi" },
  { value: "ALL", label: "Semua" },
];

export function StatusTabs({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`/dashboard/pendaftar?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => handleChange(tab.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            current === tab.value
              ? "bg-[#071A3D] text-white"
              : "bg-white text-[#64748B] hover:bg-[#F1F5F9]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
