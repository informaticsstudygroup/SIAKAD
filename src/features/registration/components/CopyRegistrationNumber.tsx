"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Sebelumnya nomor pendaftaran hanya diberi ikon salin sebagai hiasan, bukan
 * tombol — pendaftar mengira bisa diklik padahal tidak terjadi apa pun. Di
 * sini nomornya sendiri yang jadi tombol, jadi targetnya besar dan jelas.
 */
export function CopyRegistrationNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard API butuh konteks aman (https atau localhost). Kalau ditolak,
      // nomornya tetap terbaca dan bisa disalin manual, jadi cukup diabaikan.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-isg-line bg-isg-tint px-4 py-3.5 text-left transition-colors hover:border-isg-blue/45"
    >
      <span className="min-w-0">
        <span className="block text-xs text-isg-muted">Nomor pendaftaran</span>
        <span className="mt-0.5 block truncate font-mono text-lg font-extrabold tracking-tight text-isg-ink">
          {value}
        </span>
      </span>

      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
          copied
            ? "bg-isg-ok/12 text-isg-ok"
            : "text-isg-blue group-hover:bg-isg-blue/10",
        )}
      >
        {copied ? (
          <Check size={14} strokeWidth={3} aria-hidden />
        ) : (
          <Copy size={14} aria-hidden />
        )}
        {copied ? "Tersalin" : "Salin"}
      </span>
    </button>
  );
}
