import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { QuizRunner } from "@/features/quiz/components/QuizRunner";
import { isQuizOpen, type QuizOption } from "@/features/quiz/types";

export const metadata: Metadata = { title: "Kerjakan Kuis" };

export default async function KerjakanKuisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["PARTICIPANT"]);
  const { id } = await params;

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, batchId: true },
  });
  if (!profile) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) notFound();

  // Semua penjagaan diulang di server: peserta bisa saja membuka URL langsung.
  if (profile.batchId !== quiz.batchId) redirect("/dashboard/kuis");
  if (!isQuizOpen(quiz)) redirect("/dashboard/kuis");
  if (quiz.questions.length === 0) redirect("/dashboard/kuis");

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_participantId: { quizId: quiz.id, participantId: profile.id } },
    select: { startedAt: true, submittedAt: true },
  });
  if (existing?.submittedAt) redirect("/dashboard/kuis");

  // Waktu mulai dicatat di server saat pertama membuka, supaya menutup tab
  // tidak mengulang hitung mundur dari awal.
  const attempt =
    existing ??
    (await prisma.quizAttempt.create({
      data: { quizId: quiz.id, participantId: profile.id, answers: {} },
      select: { startedAt: true, submittedAt: true },
    }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-5 lg:p-8">
      {quiz.instructions ? (
        <p className="rounded-card bg-isg-tint p-4 text-sm text-isg-ink-soft">
          {quiz.instructions}
        </p>
      ) : null}

      {/* Kunci jawaban sengaja tidak ikut dikirim ke klien. */}
      <QuizRunner
        quizId={quiz.id}
        title={quiz.title}
        durationMinutes={quiz.durationMinutes}
        startedAt={attempt.startedAt.toISOString()}
        questions={quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options as QuizOption[],
          points: q.points,
        }))}
      />

      <Link
        href="/dashboard/kuis"
        className="text-center text-sm font-bold text-isg-muted hover:text-isg-ink"
      >
        Keluar tanpa mengumpulkan
      </Link>
    </div>
  );
}
