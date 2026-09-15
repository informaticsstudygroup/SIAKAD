import type { Metadata } from "next";
import Link from "next/link";
import { Eye, UserRound, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { loadParticipantProgress } from "@/features/monitoring/data";
import {
  ATTENDANCE_TARGET,
  SCORE_TARGET,
} from "@/features/dashboard/participant/data";
import { cn } from "@/utils/cn";

import { getManagedBatchScope } from "@/lib/scope";

export const metadata: Metadata = { title: "Pantau Peserta" };

export default async function PantauPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["ADVISOR", "ADMIN", "MENTOR", "CO_MENTOR"]);
  const isStaffMentor = user.role === "MENTOR" || user.role === "CO_MENTOR";

  const { batch: rawBatch } = await searchParams;

  const scope = isStaffMentor ? await getManagedBatchScope(session) : { all: true as const };
  const allowedBatchIds = scope?.all ? null : (scope?.ids ?? []);

  // Jika mentor belum ditugaskan ke angkatan mana pun, langsung tampilkan state khusus
  if (allowedBatchIds && allowedBatchIds.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
            Progres Peserta
          </h1>
          <p className="text-sm text-isg-muted">
            Pantau progres mahasiswa di angkatan yang kamu dampingi.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <Users size={30} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum Ada Angkatan Dampingan</p>
          <p className="max-w-xs text-sm text-isg-muted">
            Kamu belum ditugaskan ke angkatan mana pun oleh Admin.
          </p>
        </div>
      </div>
    );
  }

  // Mentor hanya melihat angkatan yang dibina; Admin/Advisor melihat semua angkatan
  const batches = await prisma.batch.findMany({
    where: allowedBatchIds ? { id: { in: allowedBatchIds } } : {},
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  // Nilai dari URL divalidasi terhadap daftar angkatan yang diizinkan untuk pengguna
  let batchId = batches.some((b) => b.id === rawBatch) ? rawBatch : undefined;

  // Jika mentor hanya punya 1 angkatan dan tidak ada query param, langsung default ke angkatan tersebut
  if (!batchId && isStaffMentor && batches.length === 1) {
    batchId = batches[0].id;
  }

  const rows = await loadParticipantProgress(
    batchId
      ? { batchId }
      : allowedBatchIds
        ? { batchIds: allowedBatchIds }
        : undefined,
  );

  const eligible = rows.filter((r) => r.eligible).length;

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
          Progres Peserta
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-isg-muted">
          <Eye size={14} aria-hidden />
          {rows.length} peserta · {eligible} sudah memenuhi syarat sertifikat
        </p>
      </div>

      {batches.length > 1 || !isStaffMentor ? (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href="/dashboard/pantau" active={!batchId}>
            {isStaffMentor ? "Semua Angkatan Binaan" : "Semua Angkatan"}
          </FilterChip>
          {batches.map((b) => (
            <FilterChip
              key={b.id}
              href={`/dashboard/pantau?batch=${b.id}`}
              active={batchId === b.id}
            >
              {b.name}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <Users size={30} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum ada peserta</p>
          <p className="max-w-xs text-sm text-isg-muted">
            Peserta akan muncul di sini setelah diverifikasi Admin.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-isg-line">
                  <Th>Peserta</Th>
                  <Th>Angkatan</Th>
                  <Th align="right">Kehadiran</Th>
                  <Th align="right">Tugas</Th>
                  <Th align="right">Rata-rata Tugas</Th>
                  <Th align="right">Kuis</Th>
                  <Th align="right">Rata-rata Kuis</Th>
                  <Th align="right">Sertifikat</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-isg-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-isg-tint ring-1 ring-isg-line">
                          {row.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- data URL
                            <img
                              src={row.photoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-isg-muted">
                              <UserRound size={16} aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-isg-ink">{row.name}</p>
                          <p className="font-mono text-xs text-isg-muted">
                            {row.studentId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-isg-ink-soft">
                      {row.batchName ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          row.totalMeetings === 0
                            ? "text-isg-muted"
                            : row.attendancePercent >= ATTENDANCE_TARGET
                              ? "text-isg-ok"
                              : "text-isg-warn",
                        )}
                      >
                        {row.totalMeetings === 0 ? "—" : `${row.attendancePercent}%`}
                      </span>
                      <span className="ml-1 text-xs text-isg-muted">
                        ({row.attendanceCount}
                        {row.totalMeetings > 0 ? `/${row.totalMeetings}` : ""})
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-isg-ink-soft">
                      <span className="font-semibold text-isg-ink">{row.tasksSubmitted}</span>
                      {row.totalTasks > 0 ? (
                        <span className="text-xs text-isg-muted">/{row.totalTasks}</span>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Score value={row.taskAverage} />
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-isg-ink-soft">
                      <span className="font-semibold text-isg-ink">{row.quizzesTaken}</span>
                      {row.totalQuizzes > 0 ? (
                        <span className="text-xs text-isg-muted">/{row.totalQuizzes}</span>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Score value={row.quizAverage} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          row.eligible
                            ? "bg-isg-ok/10 text-isg-ok"
                            : "bg-isg-tint text-isg-muted",
                        )}
                      >
                        {row.eligible ? "Memenuhi" : "Belum"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-isg-muted">
        Syarat sertifikat: kehadiran minimal {ATTENDANCE_TARGET}% dan rata-rata tugas
        minimal {SCORE_TARGET}.
      </p>
    </div>
  );
}

function Score({ value }: { value: number | null }) {
  if (value === null) return <span className="text-isg-muted">—</span>;
  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        value >= SCORE_TARGET ? "text-isg-ok" : "text-isg-warn",
      )}
    >
      {value}
    </span>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-bold transition-colors",
        active
          ? "bg-isg-ink text-white"
          : "border border-isg-line bg-isg-surface text-isg-ink-soft hover:border-isg-blue/40",
      )}
    >
      {children}
    </Link>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-bold uppercase tracking-wide text-isg-muted",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}
