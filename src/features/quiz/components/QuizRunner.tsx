"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock, Loader2, Send } from "lucide-react";
import { submitQuizAttempt } from "@/features/quiz/actions/quiz-actions";
import { OPTION_LABELS, type QuizOption } from "@/features/quiz/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";

/** Soal versi peserta — kunci jawaban sengaja tidak ikut dikirim. */
export type RunnerQuestion = {
  id: string;
  text: string;
  options: QuizOption[];
  points: number;
};

type SubmitResult = {
  score?: number;
  correct?: number;
  total?: number;
  error?: string;
};

function draftKey(quizId: string) {
  return `isg-kuis-draf:${quizId}`;
}

export function QuizRunner({
  quizId,
  title,
  questions,
  durationMinutes,
  startedAt,
  endAt,
}: {
  quizId: string;
  title: string;
  questions: RunnerQuestion[];
  durationMinutes: number;
  startedAt: string;
  endAt: string;
}) {
  // Batas waktu ikut dipotong oleh jam tutup kuis: peserta yang mulai lima
  // menit sebelum kuis ditutup hanya punya lima menit, bukan durasi penuh.
  const deadline = Math.min(
    new Date(startedAt).getTime() + durationMinutes * 60_000,
    new Date(endAt).getTime(),
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((deadline - Date.now()) / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const done = result !== null && !result.error;

  // Jawaban disimpan di perangkat supaya tidak hilang saat halaman dimuat
  // ulang, misalnya karena HP kehabisan memori atau tab tertutup.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey(quizId));
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        answersRef.current = parsed;
        // Draf hanya ada di browser, jadi baru bisa dibaca setelah hidrasi;
        // membacanya saat render membuat HTML server dan klien berbeda.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(parsed);
      }
    } catch {
      // Penyimpanan tidak tersedia (mode privat): kuis tetap jalan tanpa draf.
    }
  }, [quizId]);

  const chooseAnswer = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionId };
        answersRef.current = next;
        try {
          localStorage.setItem(draftKey(quizId), JSON.stringify(next));
        } catch {
          // Lihat catatan di atas.
        }
        return next;
      });
    },
    [quizId],
  );

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirming(false);

    const response = await submitQuizAttempt(quizId, answersRef.current);
    if (!response.error) {
      try {
        localStorage.removeItem(draftKey(quizId));
      } catch {
        // Lihat catatan di atas.
      }
    }
    setResult(response);
    submittingRef.current = false;
    setSubmitting(false);
  }, [quizId]);

  // Sisa waktu dihitung ulang dari batas waktu, bukan dikurangi satu per
  // detik: interval berhenti saat layar HP terkunci, sehingga hitungan lama
  // tertinggal dan peserta mendapat waktu tambahan.
  useEffect(() => {
    if (done) return;
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, done]);

  // Waktu habis: kirim otomatis sekali saja. Kalau gagal, peserta mengirim
  // ulang sendiri lewat tombol; sebelumnya kegagalan memicu kiriman berulang.
  useEffect(() => {
    if (secondsLeft > 0 || done || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void submit();
  }, [secondsLeft, done, submit]);

  function jumpTo(questionId: string) {
    document
      .getElementById(`soal-${questionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  const unanswered = questions.length - answeredCount;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
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
            // Server dan browser menghitung sisa waktu pada detik yang berbeda.
            suppressHydrationWarning
          >
            <Clock size={15} aria-hidden />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-isg-tint"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kemajuan menjawab"
        >
          <div
            className="h-full rounded-full bg-isg-blue transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <nav aria-label="Lompat ke soal" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => jumpTo(question.id)}
              aria-label={`Soal ${index + 1}${answers[question.id] ? ", sudah dijawab" : ""}`}
              className={cn(
                "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition-colors",
                answers[question.id]
                  ? "bg-isg-blue text-white"
                  : "bg-isg-tint text-isg-muted hover:text-isg-ink",
              )}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      </div>

      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <li
            key={question.id}
            id={`soal-${question.id}`}
            className="flex scroll-mt-48 flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-line font-bold text-isg-ink">
                <span className="text-isg-muted">{index + 1}.</span> {question.text}
              </p>
              <span className="shrink-0 rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-muted">
                {question.points} poin
              </span>
            </div>

            <div role="radiogroup" aria-label={`Pilihan soal ${index + 1}`} className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    // `relative` wajib: radio di dalamnya diposisikan absolut.
                    // Tanpa itu radio "nyasar" ke luar area gulir, lalu di HP
                    // browser menggeser seluruh tata letak untuk memperlihatkan
                    // radio yang difokus, dan layar tampak putih kosong.
                    className={cn(
                      "relative flex min-h-12 cursor-pointer touch-manipulation items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors select-none",
                      "has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-isg-blue/20",
                      selected
                        ? "border-isg-blue bg-isg-blue/5 font-semibold text-isg-ink"
                        : "border-isg-line text-isg-ink-soft hover:border-isg-blue/40 active:bg-isg-tint",
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={selected}
                      onChange={() => chooseAnswer(question.id, option.id)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold transition-colors",
                        selected ? "bg-isg-blue text-white" : "bg-isg-tint text-isg-muted",
                      )}
                    >
                      {OPTION_LABELS[optionIndex]}
                    </span>
                    <span className="min-w-0 wrap-break-word">{option.text}</span>
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
          {result.error} Jawabanmu masih tersimpan di perangkat ini, coba kirim lagi.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 rounded-card border border-isg-line bg-isg-surface p-5">
        {unanswered > 0 ? (
          <p className="text-sm text-isg-warn">
            Masih ada {unanswered} soal yang belum dijawab.
          </p>
        ) : (
          <p className="text-sm text-isg-ok">Semua soal sudah dijawab.</p>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
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
            <>
              <Send size={16} aria-hidden />
              Kumpulkan Jawaban
            </>
          )}
        </button>
        <p className="text-center text-xs text-isg-muted">
          Jawaban tidak bisa diubah setelah dikumpulkan.
        </p>
      </div>

      {confirming ? (
        <ConfirmDialog
          title="Kumpulkan jawaban?"
          description={
            unanswered > 0
              ? `${unanswered} soal belum dijawab dan akan dihitung salah. Jawaban tidak bisa diubah lagi setelah dikumpulkan.`
              : "Jawaban tidak bisa diubah lagi setelah dikumpulkan."
          }
          confirmLabel="Kumpulkan"
          isPending={submitting}
          onConfirm={() => void submit()}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}
