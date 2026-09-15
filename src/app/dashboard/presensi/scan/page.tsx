import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { checkInOnPageLoad } from "@/features/attendance/actions/attendance-actions";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Hasil Presensi" };

/**
 * Tujuan QR saat dipindai memakai kamera bawaan HP. Token ditukar jadi
 * kehadiran begitu halaman dibuka, lalu hasilnya ditampilkan.
 */
export default async function ScanResultPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await auth();
  requireRole(session, ["PARTICIPANT"]);

  const { t } = await searchParams;
  const result = t
    ? await checkInOnPageLoad(t)
    : { ok: false, message: "Kode presensi tidak ditemukan di tautan." };

  return (
    <div className="flex flex-1 items-center justify-center p-5 lg:p-8">
      <div className="w-full max-w-sm rounded-card border border-isg-line bg-isg-surface p-7 text-center">
        <span
          aria-hidden
          className={cn(
            "mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full",
            result.ok ? "bg-isg-ok/12 text-isg-ok" : "bg-isg-bad/12 text-isg-bad",
          )}
        >
          {result.ok ? <CheckCircle2 size={28} /> : <CircleAlert size={28} />}
        </span>

        <h1 className="text-xl font-extrabold tracking-tight text-isg-ink">
          {result.ok
            ? "alreadyRecorded" in result && result.alreadyRecorded
              ? "Sudah tercatat"
              : "Kehadiran tercatat"
            : "Gagal mencatat"}
        </h1>
        <p className="mt-2 text-sm text-isg-ink-soft">{result.message}</p>
        {"meetingTitle" in result && result.meetingTitle ? (
          <p className="mt-1 text-xs text-isg-muted">{result.meetingTitle}</p>
        ) : null}

        <Link
          href="/dashboard/presensi"
          className="mt-7 flex h-12 items-center justify-center gap-2 rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
        >
          <ArrowLeft size={16} aria-hidden />
          Ke halaman Presensi
        </Link>
      </div>
    </div>
  );
}
