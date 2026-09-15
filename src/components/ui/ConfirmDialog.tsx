"use client";

import { cn } from "@/utils/cn";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isDanger,
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  isDanger?: boolean;
  isPending?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="absolute inset-0 bg-[#071A3D]/40"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-[#102033]">{title}</h2>
        <p className="mt-1.5 text-sm text-[#64748B]">{description}</p>
        {error ? <p className="mt-3 text-sm text-[#E5484D]">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#102033] hover:bg-[#F7FAFC]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              isDanger ? "bg-[#E5484D] hover:bg-[#d43e43]" : "bg-[#0C81E4] hover:bg-[#0a6fc7]",
              isPending && "cursor-not-allowed opacity-70",
            )}
          >
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
