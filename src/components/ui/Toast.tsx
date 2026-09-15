"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";

export type ToastTone = "success" | "error";

export type ToastMessage = {
  /** Dipakai sebagai key React supaya toast yang sama bisa muncul ulang. */
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

/**
 * Pemberitahuan singkat setelah sebuah aksi selesai. Dipakai di verifikasi
 * pendaftar supaya admin tahu email benar-benar terkirim atau gagal —
 * sebelumnya aksi selesai tanpa tanda apa pun di layar.
 */
export function Toast({
  message,
  onDismiss,
  duration = 7000,
}: {
  message: ToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}) {
  const id = message?.id;

  useEffect(() => {
    if (id === undefined) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  if (!message) return null;

  const success = message.tone === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:justify-end">
      <div
        data-testid="toast"
        role={success ? "status" : "alert"}
        aria-live={success ? "polite" : "assertive"}
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-card border p-4 shadow-pop motion-safe:animate-[toast-in_0.3s_cubic-bezier(0.2,0.8,0.2,1)]",
          success
            ? "border-isg-ok/30 bg-isg-surface"
            : "border-isg-bad/30 bg-isg-surface",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 shrink-0",
            success ? "text-isg-ok" : "text-isg-bad",
          )}
        >
          {success ? <CheckCircle2 size={19} /> : <CircleAlert size={19} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-isg-ink">{message.title}</p>
          {message.description ? (
            <p className="mt-0.5 wrap-break-word text-sm text-isg-ink-soft">
              {message.description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pemberitahuan"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
