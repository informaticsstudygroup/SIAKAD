"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout";

export function AvatarMenu({ name, roleLabel }: { name: string; roleLabel: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#F7FAFC]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0C81E4] text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="hidden flex-col text-left sm:flex">
          <span className="text-sm font-medium text-[#102033]">{name}</span>
          <span className="text-xs text-[#64748B]">{roleLabel}</span>
        </span>
        <ChevronDown size={16} className="text-[#64748B]" aria-hidden />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-lg">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#102033] hover:bg-[#F7FAFC]"
          >
            <LogOut size={16} aria-hidden />
            Keluar
          </button>
        </form>
      </div>
    </details>
  );
}
