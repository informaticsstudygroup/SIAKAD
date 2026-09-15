import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Circle, CircleAlert, CircleX, Copy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateID } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import { ACCOUNT_STATUS_META as STATUS_META } from "@/features/verification/status-meta";

export const metadata: Metadata = {
  title: "Status Pendaftaran",
};

const TIMELINE_STEPS = ["PENDING", "VERIFIED"] as const;

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
    <main className="flex min-h-screen flex-1 flex-col bg-isg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        {/* Halaman ini di luar route group (public), jadi tidak punya navbar —
            tombol kembali disediakan sendiri. */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="-ml-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            Kembali ke beranda
          </Link>
          <Image src="/LOGOISG.png" alt="" width={34} height={34} aria-hidden />
        </div>

        {/* Nomor pendaftaran ditaruh paling menonjol — ini satu-satunya hal yang
            benar-benar perlu disimpan pendaftar setelah submit. */}
        <div className="rounded-xl2 border border-isg-line bg-isg-surface p-6 shadow-pop sm:p-8">
          <div
            className={cn(
              "mb-7 flex flex-col items-center gap-2 rounded-card px-5 py-7 text-center",
              status === "VERIFIED" && "bg-isg-ok/10",
              status === "PENDING" && "bg-isg-warn/10",
              status === "REJECTED" && "bg-isg-bad/10",
              (status === "REVISION_REQUIRED" || status === "DISABLED") && "bg-isg-tint",
            )}
          >
            {status === "VERIFIED" ? (
              <CheckCircle2 size={30} className="text-isg-ok" aria-hidden />
            ) : status === "REJECTED" ? (
              <CircleX size={30} className="text-isg-bad" aria-hidden />
            ) : (
              <CircleAlert size={30} className="text-isg-warn" aria-hidden />
            )}
            <h1 className="text-xl font-extrabold tracking-tight text-isg-ink">
              {meta.title}
            </h1>
            <p className="max-w-sm text-sm text-isg-ink-soft">{meta.description}</p>
          </div>

          <div className="mb-6 rounded-card border border-dashed border-isg-blue/35 bg-isg-tint px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-isg-muted">
              Nomor pendaftaranmu
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-isg-ink">
              {participant.registrationNumber}
            </p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-isg-muted">
              <Copy size={12} aria-hidden />
              Simpan nomor ini untuk mengecek status kapan saja
            </p>
          </div>

          {onTimeline ? (
            <ol className="mb-6 flex items-center gap-2">
              {TIMELINE_STEPS.map((step, index) => {
                const reached = TIMELINE_STEPS.indexOf(status) >= index;
                return (
                  <li key={step} className="flex flex-1 items-center gap-2">
                    {reached ? (
                      <CheckCircle2 size={20} className="shrink-0 text-isg-ok" aria-hidden />
                    ) : (
                      <Circle size={20} className="shrink-0 text-isg-line" aria-hidden />
                    )}
                    <span
                      className={cn(
                        "text-xs font-bold",
                        reached ? "text-isg-ink" : "text-isg-muted",
                      )}
                    >
                      {step === "PENDING" ? "Menunggu Verifikasi" : "Terverifikasi"}
                    </span>
                    {index < TIMELINE_STEPS.length - 1 ? (
                      <div
                        className={cn(
                          "h-0.5 flex-1 rounded-full",
                          reached ? "bg-isg-ok" : "bg-isg-line",
                        )}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}

          <dl className="mb-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-isg-line pt-6 text-sm">
            <Item label="Nama Pendaftar" value={participant.user.name} />
            <Item label="NIM" value={participant.studentId} />
            <Item label="Semester" value={`Semester ${participant.semester}`} />
            <Item label="Tanggal Daftar" value={formatDateID(participant.registeredAt)} />
          </dl>

          {participant.verificationLogs.length > 0 ? (
            <div className="mb-6 flex flex-col gap-3 border-t border-isg-line pt-6">
              <span className="text-sm font-extrabold text-isg-ink">Riwayat Verifikasi</span>
              {participant.verificationLogs.map((log) => (
                <div key={log.id} className="rounded-card bg-isg-tint p-4 text-sm">
                  <p className="font-bold text-isg-ink">{STATUS_META[log.status].title}</p>
                  {log.note ? <p className="mt-1 text-isg-ink-soft">{log.note}</p> : null}
                  <p className="mt-1.5 text-xs text-isg-muted">
                    {formatDateID(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {status === "VERIFIED" ? (
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
            >
              Masuk sekarang
            </Link>
          ) : (
            <p className="text-center text-sm text-isg-muted">
              Sudah diverifikasi?{" "}
              <Link href="/login" className="font-bold text-isg-blue hover:underline">
                Coba masuk
              </Link>
            </p>
          )}
        </div>

      </div>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-isg-muted">{label}</dt>
      <dd className="mt-0.5 font-bold text-isg-ink">{value}</dd>
    </div>
  );
}
