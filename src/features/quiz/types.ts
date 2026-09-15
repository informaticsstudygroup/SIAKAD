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
