import type { QuizStatus } from "@prisma/client";

/** Satu pilihan jawaban. Disimpan sebagai JSON di kolom Question.options. */
export type QuizOption = { id: string; text: string };

export type QuestionRow = {
  id: string;
  text: string;
  options: QuizOption[];
  correctOption: string;
  points: number;
  order: number;
};

export type QuizRow = {
  id: string;
  title: string;
  topic: string;
  instructions: string | null;
  durationMinutes: number;
  startAt: Date;
  endAt: Date;
  status: QuizStatus;
  batch: { id: string; name: string };
  _count: { questions: number; attempts: number };
  /** Hanya untuk peserta: percobaan miliknya sendiri. */
  myAttempt?: {
    id: string;
    score: number | null;
    startedAt: Date;
    submittedAt: Date | null;
  } | null;
};

export const QUIZ_STATUS_LABEL: Record<QuizStatus, string> = {
  DRAFT: "Draf",
  ACTIVE: "Aktif",
  INACTIVE: "Ditutup",
};

export const QUIZ_STATUS_TONE: Record<QuizStatus, string> = {
  DRAFT: "bg-isg-tint text-isg-muted",
  ACTIVE: "bg-isg-ok/10 text-isg-ok",
  INACTIVE: "bg-isg-bad/10 text-isg-bad",
};

export const OPTION_LABELS = ["A", "B", "C", "D"];

/**
 * ID pilihan yang tersimpan di jawaban peserta. ID pilihan tidak ikut berubah
 * saat soal diedit, supaya jawaban lama tetap menunjuk pilihan yang sama.
 */
export const OPTION_IDS = ["a", "b", "c", "d"] as const;

/** Nilai 0–100 dari bobot poin soal yang dijawab benar. */
export function gradeAnswers(
  questions: { id: string; correctOption: string; points: number }[],
  answers: Record<string, string>,
) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  let earned = 0;
  let correct = 0;
  for (const question of questions) {
    if (answers[question.id] === question.correctOption) {
      earned += question.points;
      correct += 1;
    }
  }
  const score = totalPoints ? Math.round((earned / totalPoints) * 100) : 0;
  return { score, correct };
}

/** Kuis bisa dikerjakan kalau aktif dan sekarang berada di rentang waktunya. */
export function isQuizOpen(quiz: { status: QuizStatus; startAt: Date; endAt: Date }) {
  const now = new Date();
  return (
    quiz.status === "ACTIVE" &&
    now >= new Date(quiz.startAt) &&
    now <= new Date(quiz.endAt)
  );
}

export function formatQuizWindow(startAt: Date, endAt: Date) {
  const fmt = (d: Date) =>
    new Date(d).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(startAt)} – ${fmt(endAt)}`;
}
