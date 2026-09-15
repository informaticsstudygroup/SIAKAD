import type { Metadata } from "next";
import { LineChart } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import {
  ATTENDANCE_TARGET,
  SCORE_TARGET,
} from "@/features/dashboard/participant/data";
import {
  ASSIGNMENT_CATEGORY_LABEL,
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  formatDeadline,
} from "@/features/assignment/types";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Nilai" };

export default async function NilaiPage() {
  const session = await auth();
  const user = requireRole(session, ["PARTICIPANT"]);

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const [submissions, attendances] = await Promise.all([
    profile
      ? prisma.submission.findMany({
          where: { participantId: profile.id },
          select: {
            id: true,
            score: true,
            status: true,
            feedback: true,
            submittedAt: true,
            assignment: {
              select: { title: true, category: true, deadline: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
    profile
      ? prisma.attendance.findMany({
          where: { participantId: profile.id },
          select: { status: true },
        })
      : Promise.resolve([]),
  ]);

  const graded = submissions.filter((s) => s.score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length)
    : 0;
  const highest = graded.length ? Math.max(...graded.map((s) => s.score ?? 0)) : 0;
  const lowest = graded.length ? Math.min(...graded.map((s) => s.score ?? 0)) : 0;

  const hadir = attendances.filter((a) => a.status === "HADIR").length;
  const attendancePercent = attendances.length
    ? Math.round((hadir / attendances.length) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Nilai</h1>
        <p className="text-sm text-isg-muted">
          Rekap nilai tugas dan proyek yang sudah dinilai mentor.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Rata-rata Nilai"
          value={graded.length ? `${average}` : "—"}
          badge={`${graded.length} dinilai`}
          tone="hero"
        />
        <StatTile label="Nilai Tertinggi" value={graded.length ? `${highest}` : "—"} tone="mint" />
        <StatTile label="Nilai Terendah" value={graded.length ? `${lowest}` : "—"} tone="blue" />
        <StatTile
          label="Kehadiran"
          value={`${attendancePercent}%`}
          tone="cyan"
        />
      </div>

      <div className="rounded-card border border-isg-line bg-isg-surface p-5">
        <h2 className="mb-4 text-base font-extrabold text-isg-ink">
          Syarat Kelulusan Sertifikat
        </h2>
        <div className="flex flex-col gap-4">
          <Meter
            label={`Kehadiran (minimum ${ATTENDANCE_TARGET}%)`}
            percent={attendancePercent}
            valueLabel={`${attendancePercent}%`}
            tone={attendancePercent >= ATTENDANCE_TARGET ? "success" : "warning"}
          />
          <Meter
            label={`Rata-rata nilai (minimum ${SCORE_TARGET})`}
            percent={average}
            valueLabel={graded.length ? `${average}` : "belum ada"}
            tone={average >= SCORE_TARGET ? "success" : "warning"}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <LineChart size={30} aria-hidden className="text-isg-muted" />
            <p className="text-sm font-semibold text-isg-ink">Belum ada nilai</p>
            <p className="max-w-xs text-sm text-isg-muted">
              Nilai akan muncul di sini setelah kamu mengumpulkan tugas dan mentor
              menilainya.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-isg-line">
            {submissions.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
                      {ASSIGNMENT_CATEGORY_LABEL[row.assignment.category]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        SUBMISSION_STATUS_TONE[row.status],
                      )}
                    >
                      {SUBMISSION_STATUS_LABEL[row.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate font-bold text-isg-ink">
                    {row.assignment.title}
                  </p>
                  <p className="text-xs text-isg-muted">
                    Dikumpulkan {formatDeadline(row.submittedAt)}
                  </p>
                  {row.feedback ? (
                    <p className="mt-2 rounded-xl bg-isg-tint p-3 text-sm text-isg-ink-soft">
                      &ldquo;{row.feedback}&rdquo;
                    </p>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "shrink-0 text-3xl font-extrabold tabular-nums",
                    row.score === null
                      ? "text-isg-muted"
                      : row.score >= SCORE_TARGET
                        ? "text-isg-ok"
                        : "text-isg-warn",
                  )}
                >
                  {row.score ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
