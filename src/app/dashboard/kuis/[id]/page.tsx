import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { QuestionEditor } from "@/features/quiz/components/QuestionEditor";
import {
  QUIZ_STATUS_LABEL,
  QUIZ_STATUS_TONE,
  formatQuizWindow,
  type QuizOption,
} from "@/features/quiz/types";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Kelola Kuis" };

export default async function KelolaKuisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requireRole(session, ["ADMIN", "MENTOR", "CO_MENTOR"]);

  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      batch: { select: { name: true } },
      questions: { orderBy: { order: "asc" } },
      attempts: {
        where: { submittedAt: { not: null } },
        select: {
          id: true,
          score: true,
          submittedAt: true,
          participant: {
            select: { studentId: true, user: { select: { name: true } } },
          },
        },
        orderBy: { score: "desc" },
      },
    },
  });

  if (!quiz) notFound();

  const questions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options as QuizOption[],
    correctOption: q.correctOption,
    points: q.points,
    order: q.order,
  }));

  const average = quiz.attempts.length
    ? Math.round(
        quiz.attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) /
          quiz.attempts.length,
      )
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div>
        <Link
          href="/dashboard/kuis"
          className="-ml-3 mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          Kembali ke Kuis
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              QUIZ_STATUS_TONE[quiz.status],
            )}
          >
            {QUIZ_STATUS_LABEL[quiz.status]}
          </span>
          <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
            {quiz.batch.name}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-isg-ink">
          {quiz.title}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-isg-muted">
          <span>{quiz.topic}</span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden />
            {quiz.durationMinutes} menit · {formatQuizWindow(quiz.startAt, quiz.endAt)}
          </span>
        </p>
      </div>

      <QuestionEditor quizId={quiz.id} questions={questions} />

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-extrabold text-isg-ink">
          Hasil Peserta{" "}
          <span className="font-medium text-isg-muted">
            ({quiz.attempts.length} mengumpulkan
            {quiz.attempts.length ? `, rata-rata ${average}` : ""})
          </span>
        </h2>

        {quiz.attempts.length === 0 ? (
          <p className="rounded-card border border-dashed border-isg-line bg-isg-surface p-10 text-center text-sm text-isg-muted">
            Belum ada peserta yang mengerjakan.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
            {quiz.attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex items-center justify-between gap-4 border-b border-isg-line px-5 py-3.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-isg-ink">
                    {attempt.participant.user.name}
                  </p>
                  <p className="font-mono text-xs text-isg-muted">
                    {attempt.participant.studentId}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-2xl font-extrabold tabular-nums",
                    (attempt.score ?? 0) >= 70 ? "text-isg-ok" : "text-isg-warn",
                  )}
                >
                  {attempt.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
