import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateID } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import { ACCOUNT_STATUS_META as STATUS_META } from "@/features/verification/status-meta";
import { CopyRegistrationNumber } from "@/features/registration/components/CopyRegistrationNumber";

export const metadata: Metadata = {
  title: "Status Pendaftaran",
};

const TIMELINE_STEPS = ["PENDING", "VERIFIED"] as const;

const STEP_LABEL: Record<(typeof TIMELINE_STEPS)[number], string> = {
  PENDING: "Menunggu verifikasi",
  VERIFIED: "Terverifikasi",
};

export default async function RegistrationStatusPage({
  params,
}: {
  params: Promise<{ registrationNumber: string }>;
}) {
  const { registrationNumber } = await params;

  const participant = await prisma.participantProfile.findUnique({
    where: { registrationNumber },
    include: {
      user: true,
      verificationLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!participant) notFound();

  const status = participant.user.status;
  const meta = STATUS_META[status];
  const onTimeline = status === "PENDING" || status === "VERIFIED";

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-isg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        {/* Halaman ini di luar route group (public), jadi tidak punya navbar —
            tombol kembali disediakan sendiri. */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="-ml-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            Kembali
          </Link>
          <Image src="/LOGOISG.png" alt="" width={34} height={34} aria-hidden />
        </div>

        {/*
          Judul dan status ditaruh langsung di halaman, tidak lagi di dalam
          blok berwarna besar yang memakan separuh layar. Statusnya cukup
          dinyatakan sebagai label kecil di atas judul.
        */}
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
            status === "VERIFIED" && "bg-isg-ok/10 text-isg-ok",
            status === "PENDING" && "bg-isg-warn/10 text-isg-warn",
            status === "REJECTED" && "bg-isg-bad/10 text-isg-bad",
            status === "REVISION_REQUIRED" && "bg-isg-blue/10 text-isg-blue",
            status === "DISABLED" && "bg-isg-tint text-isg-muted",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {meta.title}
        </span>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-isg-ink sm:text-3xl">
          {participant.user.name}
        </h1>
        <p className="mt-2 text-base text-isg-ink-soft">{meta.description}</p>

        <div className="mt-6 flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 sm:p-6">
          <CopyRegistrationNumber value={participant.registrationNumber} />

          <p className="text-sm text-isg-muted">
            Simpan nomor ini. Buka halaman yang sama kapan saja untuk mengecek
            statusmu tanpa perlu masuk.
          </p>

          {onTimeline ? (
            <ol className="flex items-center gap-3 border-t border-isg-line pt-5">
              {TIMELINE_STEPS.map((step, index) => {
                const current = TIMELINE_STEPS.indexOf(status);
                // Centang hanya untuk tahap yang sudah lewat. Tahap yang
                // sedang berjalan ditandai titik, bukan centang, supaya tidak
                // terbaca seolah verifikasinya sudah selesai.
                const done = current > index;
                const active = current === index;
                const last = index === TIMELINE_STEPS.length - 1;
                return (
                  <li
                    key={step}
                    className={cn("flex items-center gap-3", !last && "flex-1")}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          done && "border-isg-ok bg-isg-ok text-white",
                          active && "border-isg-warn bg-isg-warn/15",
                          !done && !active && "border-isg-line bg-isg-surface",
                        )}
                        aria-hidden
                      >
                        {done ? <Check size={12} strokeWidth={3.5} /> : null}
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-isg-warn" />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          done || active ? "text-isg-ink" : "text-isg-muted",
                        )}
                      >
                        {STEP_LABEL[step]}
                      </span>
                    </span>
                    {!last ? (
                      <span
                        aria-hidden
                        className={cn(
                          "h-px flex-1 rounded-full",
                          done ? "bg-isg-ok" : "bg-isg-line",
                        )}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-isg-line pt-5 text-sm">
            <Item label="NIM" value={participant.studentId} />
            <Item label="Semester" value={`Semester ${participant.semester}`} />
            <Item label="Email" value={participant.user.email} full />
            <Item
              label="Tanggal daftar"
              value={formatDateID(participant.registeredAt)}
            />
          </dl>
        </div>

        {participant.verificationLogs.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5 sm:p-6">
            <h2 className="text-sm font-extrabold text-isg-ink">
              Riwayat verifikasi
            </h2>
            {participant.verificationLogs.map((log) => (
              <div
                key={log.id}
                className="border-l-2 border-isg-line pl-4 text-sm"
              >
                <p className="font-bold text-isg-ink">
                  {STATUS_META[log.status].title}
                </p>
                {log.note ? (
                  <p className="mt-0.5 text-isg-ink-soft">{log.note}</p>
                ) : null}
                <p className="mt-1 text-xs text-isg-muted">
                  {formatDateID(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {status === "VERIFIED" ? (
          <Link
            href="/login"
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
          >
            Masuk sekarang
          </Link>
        ) : (
          <p className="mt-6 text-center text-sm text-isg-muted">
            Sudah diverifikasi?{" "}
            <Link href="/login" className="font-bold text-isg-blue hover:underline">
              Coba masuk
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function Item({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={cn("min-w-0", full && "col-span-2")}>
      <dt className="text-xs text-isg-muted">{label}</dt>
      <dd className="mt-0.5 wrap-break-word font-semibold text-isg-ink">
        {value}
      </dd>
    </div>
  );
}
