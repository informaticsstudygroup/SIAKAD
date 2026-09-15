"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Drawer({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-[#071A3D]/40"
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#102033]">{title}</h2>
            {description ? <p className="text-sm text-[#64748B]">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Tutup panel"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F7FAFC]"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="flex flex-1 flex-col px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
