"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock, Loader2 } from "lucide-react";
import { submitQuizAttempt } from "@/features/quiz/actions/quiz-actions";
import { OPTION_LABELS, type QuizOption } from "@/features/quiz/types";
import { cn } from "@/utils/cn";

/** Soal versi peserta — kunci jawaban sengaja tidak ikut dikirim. */
export type RunnerQuestion = {
  id: string;
  text: string;
  options: QuizOption[];
  points: number;
};

export function QuizRunner({
  quizId,
  title,
  questions,
  durationMinutes,
  startedAt,
}: {
  quizId: string;
  title: string;
  questions: RunnerQuestion[];
  durationMinutes: number;
  startedAt: string;
}) {
  const deadline = new Date(startedAt).getTime() + durationMinutes * 60_000;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((deadline - Date.now()) / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score?: number;
    correct?: number;
    total?: number;
    error?: string;
  } | null>(null);

  const answeredCount = Object.keys(answers).length;
  const done = result !== null && !result.error;

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [done]);

  // Waktu habis: kirim otomatis apa adanya, supaya jawaban yang sudah diisi
  // tidak hilang begitu saja.
  useEffect(() => {
    if (secondsLeft > 0 || done || submitting) return;
    let cancelled = false;
    (async () => {
      setSubmitting(true);
      const response = await submitQuizAttempt(quizId, answers);
      if (!cancelled) {
        setResult(response);
        setSubmitting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [secondsLeft, done, submitting, quizId, answers]);

  async function handleSubmit() {
    setSubmitting(true);
    const response = await submitQuizAttempt(quizId, answers);
    setResult(response);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md rounded-card border border-isg-line bg-isg-surface p-8 text-center">
        <span
          aria-hidden
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-isg-ok/12 text-isg-ok"
        >
          <CheckCircle2 size={30} />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-isg-ink">
          Kuis selesai
        </h1>
        <p className="mt-1.5 text-sm text-isg-muted">{title}</p>

        <p className="mt-6 text-5xl font-extrabold tabular-nums text-isg-ink">
          {result?.score}
        </p>
        <p className="mt-1 text-sm text-isg-muted">
          {result?.correct} dari {result?.total} soal benar
        </p>

        <Link
          href="/dashboard/kuis"
          className="mt-8 flex h-12 items-center justify-center rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
        >
          Kembali ke daftar kuis
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const urgent = secondsLeft <= 60;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-card border border-isg-line bg-isg-surface/95 p-4 backdrop-blur">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-isg-ink">
            {title}
          </h1>
          <p className="text-sm text-isg-muted">
            {answeredCount}/{questions.length} soal terjawab
          </p>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-mono text-sm font-bold tabular-nums",
            urgent ? "bg-isg-bad/10 text-isg-bad" : "bg-isg-tint text-isg-ink",
          )}
          role="timer"
          aria-live={urgent ? "assertive" : "off"}
        >
          <Clock size={15} aria-hidden />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-isg-ink">
                <span className="text-isg-muted">{index + 1}.</span> {question.text}
              </p>
              <span className="shrink-0 rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-muted">
                {question.points} poin
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors",
                      selected
                        ? "border-isg-blue bg-isg-blue/5 font-semibold text-isg-ink"
                        : "border-isg-line text-isg-ink-soft hover:border-isg-blue/40",
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                      }
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                        selected
                          ? "bg-isg-blue text-white"
                          : "bg-isg-tint text-isg-muted",
                      )}
                    >
                      {OPTION_LABELS[optionIndex]}
                    </span>
                    {option.text}
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {result?.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-card border border-isg-bad/25 bg-isg-bad/5 p-4 text-sm text-isg-bad"
        >
          <CircleAlert size={17} aria-hidden className="mt-0.5 shrink-0" />
          {result.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 rounded-card border border-isg-line bg-isg-surface p-5">
        {answeredCount < questions.length ? (
          <p className="text-sm text-isg-warn">
            Masih ada {questions.length - answeredCount} soal yang belum dijawab.
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
            submitting && "cursor-not-allowed opacity-70",
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={16} aria-hidden className="animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kumpulkan Jawaban"
          )}
        </button>
        <p className="text-center text-xs text-isg-muted">
          Jawaban tidak bisa diubah setelah dikumpulkan.
        </p>
      </div>
    </div>
  );
}
