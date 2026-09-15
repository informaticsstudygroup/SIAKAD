"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import {
  deleteQuestion,
  saveQuestion,
  type QuizFormState,
} from "@/features/quiz/actions/quiz-actions";
import { OPTION_LABELS, type QuestionRow } from "@/features/quiz/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";

const initialState: QuizFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

export function QuestionEditor({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<QuestionRow | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  async function confirmRemove() {
    if (!removing) return;
    setIsRemoving(true);
    setRemoveError("");
    const result = await deleteQuestion(removing.id, quizId);
    setIsRemoving(false);
    if (result.error) {
      setRemoveError(result.error);
      return;
    }
    setRemoving(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-extrabold text-isg-ink">
          Soal{" "}
          <span className="font-medium text-isg-muted">
            ({questions.length} soal · {totalPoints} poin)
          </span>
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-full bg-isg-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-blue-deep"
          >
            <Plus size={15} aria-hidden />
            Tambah Soal
          </button>
        ) : null}
      </div>

      {adding ? (
        <QuestionForm
          quizId={quizId}
          question={null}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : null}

      {questions.length === 0 && !adding ? (
        <p className="rounded-card border border-dashed border-isg-line bg-isg-surface p-12 text-center text-sm text-isg-muted">
          Belum ada soal. Kuis tidak bisa dikerjakan sampai ada minimal satu soal.
        </p>
      ) : null}

      <ol className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-isg-ink">
                <span className="text-isg-muted">{index + 1}.</span> {question.text}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-muted">
                  {question.points} poin
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveError("");
                    setRemoving(question);
                  }}
                  aria-label={`Hapus soal ${index + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-bad/10 hover:text-isg-bad"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {question.options.map((option, optionIndex) => {
                const correct = option.id === question.correctOption;
                return (
                  <li
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm",
                      correct
                        ? "border-isg-ok/40 bg-isg-ok/5 font-semibold text-isg-ink"
                        : "border-isg-line text-isg-ink-soft",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold",
                        correct ? "bg-isg-ok text-white" : "bg-isg-tint text-isg-muted",
                      )}
                    >
                      {OPTION_LABELS[optionIndex]}
                    </span>
                    {option.text}
                    {correct ? (
                      <span className="ml-auto text-xs font-bold text-isg-ok">
                        Kunci jawaban
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      {removing ? (
        <ConfirmDialog
          title="Hapus soal?"
          description="Soal ini akan dihapus permanen dari kuis."
          confirmLabel="Hapus"
          isDanger
          isPending={isRemoving}
          error={removeError}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
    </div>
  );
}

function QuestionForm({
  quizId,
  question,
  onDone,
}: {
  quizId: string;
  question: QuestionRow | null;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveQuestion, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-isg-blue/30 bg-isg-blue/[0.03] p-5"
    >
      <input type="hidden" name="quizId" value={quizId} />
      {question ? <input type="hidden" name="id" value={question.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="qq-text" className="text-sm font-bold text-isg-ink">
          Pertanyaan
        </label>
        <textarea
          id="qq-text"
          name="text"
          required
          rows={2}
          placeholder="Tulis pertanyaannya di sini..."
          className={cn(inputClass, "h-auto py-3")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["A", "B", "C", "D"] as const).map((letter, index) => (
          <div key={letter} className="flex flex-col gap-1.5">
            <label htmlFor={`qq-${letter}`} className="text-sm font-bold text-isg-ink">
              Pilihan {letter}
              {index > 1 ? (
                <span className="ml-1.5 font-medium text-isg-muted">(opsional)</span>
              ) : null}
            </label>
            <input
              id={`qq-${letter}`}
              name={`option${letter}`}
              required={index < 2}
              placeholder={`Jawaban ${letter}`}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qq-correct" className="text-sm font-bold text-isg-ink">
            Kunci Jawaban
          </label>
          <select id="qq-correct" name="correctOption" required className={inputClass}>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qq-points" className="text-sm font-bold text-isg-ink">
            Poin
          </label>
          <input
            id="qq-points"
            name="points"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={1}
            className={inputClass}
          />
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-isg-bad/25 bg-isg-bad/5 px-3.5 py-2.5 text-sm text-isg-bad"
        >
          <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-isg-line px-4 py-2.5 text-sm font-bold text-isg-ink hover:bg-isg-tint"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl bg-isg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-isg-blue-deep",
            isPending && "cursor-not-allowed opacity-70",
          )}
        >
          {isPending ? "Menyimpan..." : "Simpan Soal"}
        </button>
      </div>
    </form>
  );
}
