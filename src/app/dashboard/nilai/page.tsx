import type { Metadata } from "next";
import { FileText, HelpCircle } from "lucide-react";
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

function averageOf(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    : 0;
}

export default async function NilaiPage() {
  const session = await auth();
  const user = requireRole(session, ["PARTICIPANT"]);

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, batchId: true },
  });

  const [submissions, attendances, quizAttempts, quizTotal] = await Promise.all([
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
    // Hanya kuis yang sudah dikumpulkan; percobaan yang masih berjalan belum
    // punya nilai.
    profile
      ? prisma.quizAttempt.findMany({
          where: { participantId: profile.id, submittedAt: { not: null } },
          select: {
            id: true,
            score: true,
            submittedAt: true,
            quiz: { select: { title: true, topic: true } },
          },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
    profile?.batchId
      ? prisma.quiz.count({
          where: { batchId: profile.batchId, status: { not: "DRAFT" } },
        })
      : Promise.resolve(0),
  ]);

  const taskScores = submissions
    .map((s) => s.score)
    .filter((v): v is number => v !== null);
  const quizScores = quizAttempts
    .map((a) => a.score)
    .filter((v): v is number => v !== null);
  const taskAverage = averageOf(taskScores);
  const quizAverage = averageOf(quizScores);

  const hadir = attendances.filter((a) => a.status === "HADIR").length;
  const attendancePercent = attendances.length
    ? Math.round((hadir / attendances.length) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Nilai</h1>
        <p className="text-sm text-isg-muted">
          Rekap nilai kuis, tugas, dan proyek milikmu.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Rata-rata Tugas"
          value={taskScores.length ? `${taskAverage}` : "—"}
          badge={`${taskScores.length} dinilai`}
          tone="hero"
        />
        <StatTile
          label="Rata-rata Kuis"
          value={quizScores.length ? `${quizAverage}` : "—"}
          badge={`${quizScores.length} kuis`}
          tone="blue"
        />
        <StatTile
          label="Kuis Dikerjakan"
          value={`${quizAttempts.length}/${quizTotal}`}
          tone="mint"
        />
        <StatTile label="Kehadiran" value={`${attendancePercent}%`} tone="cyan" />
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
            label={`Rata-rata nilai tugas (minimum ${SCORE_TARGET})`}
            percent={taskAverage}
            valueLabel={taskScores.length ? `${taskAverage}` : "belum ada"}
            tone={taskAverage >= SCORE_TARGET ? "success" : "warning"}
          />
        </div>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="nilai-kuis">
        <h2 id="nilai-kuis" className="text-base font-extrabold text-isg-ink">
          Kuis{" "}
          <span className="font-medium text-isg-muted">({quizAttempts.length})</span>
        </h2>
        <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
          {quizAttempts.length === 0 ? (
            <EmptyState
              icon={<HelpCircle size={30} aria-hidden className="text-isg-muted" />}
              title="Belum ada nilai kuis"
              description="Nilai muncul di sini setelah kamu mengumpulkan kuis."
            />
          ) : (
            <ul className="divide-y divide-isg-line">
              {quizAttempts.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <span className="rounded-full bg-isg-blue/10 px-2.5 py-1 text-xs font-bold text-isg-blue">
                      {attempt.quiz.topic}
                    </span>
                    <p className="mt-1.5 truncate font-bold text-isg-ink">
                      {attempt.quiz.title}
                    </p>
                    {attempt.submittedAt ? (
                      <p className="text-xs text-isg-muted">
                        Dikumpulkan {formatDeadline(attempt.submittedAt)}
                      </p>
                    ) : null}
                  </div>
                  <ScoreValue value={attempt.score} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="nilai-tugas">
        <h2 id="nilai-tugas" className="text-base font-extrabold text-isg-ink">
          Tugas &amp; Proyek{" "}
          <span className="font-medium text-isg-muted">({submissions.length})</span>
        </h2>
        <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
          {submissions.length === 0 ? (
            <EmptyState
              icon={<FileText size={30} aria-hidden className="text-isg-muted" />}
              title="Belum ada nilai tugas"
              description="Nilai muncul di sini setelah kamu mengumpulkan tugas dan mentor menilainya."
            />
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
                  <ScoreValue value={row.score} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ScoreValue({ value }: { value: number | null }) {
  return (
    <span
      className={cn(
        "shrink-0 text-3xl font-extrabold tabular-nums",
        value === null
          ? "text-isg-muted"
          : value >= SCORE_TARGET
            ? "text-isg-ok"
            : "text-isg-warn",
      )}
    >
      {value ?? "—"}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      {icon}
      <p className="text-sm font-semibold text-isg-ink">{title}</p>
      <p className="max-w-xs text-sm text-isg-muted">{description}</p>
    </div>
  );
}
