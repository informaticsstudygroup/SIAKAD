"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteQuestion,
  duplicateQuestion,
  moveQuestion,
  regradeQuiz,
  saveQuestion,
  type QuizFormState,
} from "@/features/quiz/actions/quiz-actions";
import {
  OPTION_IDS,
  OPTION_LABELS,
  type QuestionRow,
  type QuizOption,
} from "@/features/quiz/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

const initialState: QuizFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink disabled:cursor-not-allowed disabled:opacity-40";

/** null: tidak ada form terbuka; "new": soal baru; selain itu id soal yang diedit. */
type OpenForm = null | "new" | string;

export function QuestionEditor({
  quizId,
  questions,
  attemptCount,
}: {
  quizId: string;
  questions: QuestionRow[];
  attemptCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenForm>(null);
  const [removing, setRemoving] = useState<QuestionRow | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [regrading, setRegrading] = useState(false);
  const [isRegrading, setIsRegrading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastCount = useRef(0);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  function notify(tone: ToastMessage["tone"], title: string, description?: string) {
    toastCount.current += 1;
    setToast({ id: toastCount.current, tone, title, description });
  }

  function runOnQuestion(id: string, action: () => Promise<{ error?: string }>) {
    setBusyId(id);
    startTransition(async () => {
      const result = await action();
      if (result.error) notify("error", "Gagal memperbarui soal", result.error);
      router.refresh();
      setBusyId(null);
    });
  }

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
    if (open === removing.id) setOpen(null);
    setRemoving(null);
    router.refresh();
  }

  async function confirmRegrade() {
    setIsRegrading(true);
    const result = await regradeQuiz(quizId);
    setIsRegrading(false);
    setRegrading(false);
    if (result.error) {
      notify("error", "Gagal menilai ulang", result.error);
      return;
    }
    notify("success", "Nilai diperbarui", `${result.updated} jawaban peserta dinilai ulang.`);
    router.refresh();
  }

  function closeForm() {
    setOpen(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-isg-ink">
          Soal{" "}
          <span className="font-medium text-isg-muted">
            ({questions.length} soal · {totalPoints} poin)
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setOpen("new")}
          disabled={open === "new"}
          className="flex items-center gap-2 rounded-full bg-isg-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-blue-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={15} aria-hidden />
          Tambah Soal
        </button>
      </div>

      {attemptCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-card border border-isg-warn/30 bg-isg-warn/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-isg-ink-soft">
            <CircleAlert size={17} aria-hidden className="mt-0.5 shrink-0 text-isg-warn" />
            <span>
              {attemptCount} peserta sudah mengumpulkan. Mengubah soal atau kunci jawaban
              tidak otomatis mengubah nilai mereka.
            </span>
          </p>
          <button
            type="button"
            onClick={() => setRegrading(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-isg-line bg-isg-surface px-4 py-2 text-sm font-bold text-isg-ink transition-colors hover:bg-isg-tint"
          >
            <RefreshCw size={14} aria-hidden />
            Nilai Ulang
          </button>
        </div>
      ) : null}

      {questions.length === 0 && open !== "new" ? (
        <button
          type="button"
          onClick={() => setOpen("new")}
          className="flex flex-col items-center gap-2 rounded-card border border-dashed border-isg-line bg-isg-surface p-12 text-center transition-colors hover:border-isg-blue/40"
        >
          <Plus size={24} aria-hidden className="text-isg-blue" />
          <span className="text-sm font-bold text-isg-ink">Tambah soal pertama</span>
          <span className="max-w-xs text-sm text-isg-muted">
            Kuis tidak bisa dikerjakan sampai ada minimal satu soal.
          </span>
        </button>
      ) : null}

      <ol className="flex flex-col gap-3">
        {questions.map((question, index) =>
          open === question.id ? (
            <li key={question.id}>
              <QuestionForm
                quizId={quizId}
                number={index + 1}
                question={question}
                onDone={closeForm}
                onCancel={() => setOpen(null)}
              />
            </li>
          ) : (
            <QuestionCard
              key={question.id}
              question={question}
              number={index + 1}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              busy={isPending && busyId === question.id}
              disabled={isPending}
              onEdit={() => setOpen(question.id)}
              onDuplicate={() =>
                runOnQuestion(question.id, () => duplicateQuestion(question.id, quizId))
              }
              onMove={(direction) =>
                runOnQuestion(question.id, () =>
                  moveQuestion(question.id, quizId, direction),
                )
              }
              onRemove={() => {
                setRemoveError("");
                setRemoving(question);
              }}
            />
          ),
        )}
      </ol>

      {open === "new" ? (
        <QuestionForm
          quizId={quizId}
          number={questions.length + 1}
          question={null}
          onDone={closeForm}
          onCancel={() => setOpen(null)}
        />
      ) : questions.length > 0 ? (
        <button
          type="button"
          onClick={() => setOpen("new")}
          className="flex items-center justify-center gap-2 rounded-card border border-dashed border-isg-line bg-isg-surface p-4 text-sm font-bold text-isg-muted transition-colors hover:border-isg-blue/40 hover:text-isg-blue"
        >
          <Plus size={16} aria-hidden />
          Tambah soal
        </button>
      ) : null}

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

      {regrading ? (
        <ConfirmDialog
          title="Nilai ulang semua jawaban?"
          description={`Nilai ${attemptCount} peserta dihitung ulang memakai soal dan kunci jawaban saat ini. Nilai yang pernah diubah manual di Rekap Nilai akan tertimpa.`}
          confirmLabel="Nilai Ulang"
          isPending={isRegrading}
          onConfirm={confirmRegrade}
          onCancel={() => setRegrading(false)}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function QuestionCard({
  question,
  number,
  isFirst,
  isLast,
  busy,
  disabled,
  onEdit,
  onDuplicate,
  onMove,
  onRemove,
}: {
  question: QuestionRow;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5 transition-opacity",
        busy && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 text-left"
          aria-label={`Edit soal ${number}`}
        >
          <p className="whitespace-pre-line font-bold text-isg-ink">
            <span className="text-isg-muted">{number}.</span> {question.text}
          </p>
        </button>
        <span className="shrink-0 rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-muted">
          {question.points} poin
        </span>
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
              <span className="min-w-0 wrap-break-word">{option.text}</span>
              {correct ? (
                <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-bold text-isg-ok">
                  <Check size={13} aria-hidden />
                  Kunci
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="-mb-1 flex items-center justify-end gap-0.5 border-t border-isg-line pt-2">
        {busy ? (
          <Loader2 size={15} aria-hidden className="mr-auto animate-spin text-isg-muted" />
        ) : null}
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={isFirst || disabled}
          aria-label={`Pindahkan soal ${number} ke atas`}
          title="Pindah ke atas"
          className={iconButton}
        >
          <ArrowUp size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={isLast || disabled}
          aria-label={`Pindahkan soal ${number} ke bawah`}
          title="Pindah ke bawah"
          className={iconButton}
        >
          <ArrowDown size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={disabled}
          aria-label={`Duplikat soal ${number}`}
          title="Duplikat"
          className={iconButton}
        >
          <Copy size={15} aria-hidden />
        </button>
        <span aria-hidden className="mx-1 h-5 w-px bg-isg-line" />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Hapus soal ${number}`}
          title="Hapus"
          className={cn(iconButton, "hover:bg-isg-bad/10 hover:text-isg-bad")}
        >
          <Trash2 size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="ml-1 flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-isg-blue transition-colors hover:bg-isg-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil size={14} aria-hidden />
          Edit
        </button>
      </div>
    </li>
  );
}

function QuestionForm({
  quizId,
  number,
  question,
  onDone,
  onCancel,
}: {
  quizId: string;
  number: number;
  question: QuestionRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveQuestion, initialState);
  const [text, setText] = useState(question?.text ?? "");
  const [options, setOptions] = useState<QuizOption[]>(
    question?.options ?? [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
  );
  const [correct, setCorrect] = useState(question?.correctOption ?? "");
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const optionRefs = useRef(new Map<string, HTMLInputElement>());
  // Pilihan yang baru ditambahkan langsung difokus saat input-nya terpasang,
  // seperti Google Form.
  const focusOnMount = useRef<string | null>(null);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  function addOption() {
    const used = new Set(options.map((o) => o.id));
    const id = OPTION_IDS.find((candidate) => !used.has(candidate));
    if (!id) return;
    focusOnMount.current = id;
    setOptions((prev) => [...prev, { id, text: "" }]);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    if (correct === id) setCorrect("");
  }

  const canAddOption = options.length < OPTION_IDS.length;

  return (
    <form
      action={formAction}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="flex flex-col gap-4 rounded-card border-2 border-isg-blue/40 bg-isg-surface p-5 shadow-pop"
    >
      <input type="hidden" name="quizId" value={quizId} />
      {question ? <input type="hidden" name="id" value={question.id} /> : null}
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <input type="hidden" name="correctOption" value={correct} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-isg-blue">
          {question ? `Edit soal ${number}` : `Soal baru · nomor ${number}`}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup tanpa menyimpan"
          className={iconButton}
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`qq-text-${question?.id ?? "new"}`} className="sr-only">
          Pertanyaan
        </label>
        <textarea
          id={`qq-text-${question?.id ?? "new"}`}
          name="text"
          required
          rows={3}
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tulis pertanyaan..."
          className={cn(inputClass, "h-auto resize-y py-3 text-base font-semibold")}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold text-isg-ink">
          Pilihan jawaban{" "}
          <span className="font-medium text-isg-muted">
            · ketuk lingkaran untuk menandai jawaban benar
          </span>
        </legend>

        {options.map((option, index) => {
          const isCorrect = correct === option.id;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={isCorrect}
                aria-label={`Jadikan pilihan ${OPTION_LABELS[index]} jawaban benar`}
                onClick={() => setCorrect(option.id)}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
                  isCorrect ? "text-isg-ok" : "text-isg-muted hover:text-isg-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                    isCorrect ? "border-isg-ok bg-isg-ok text-white" : "border-current",
                  )}
                >
                  {isCorrect ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
                </span>
              </button>

              <span
                aria-hidden
                className="w-5 shrink-0 text-center text-xs font-extrabold text-isg-muted"
              >
                {OPTION_LABELS[index]}
              </span>

              <input
                ref={(node) => {
                  if (!node) {
                    optionRefs.current.delete(option.id);
                    return;
                  }
                  optionRefs.current.set(option.id, node);
                  if (focusOnMount.current === option.id) {
                    focusOnMount.current = null;
                    node.focus();
                  }
                }}
                value={option.text}
                required
                aria-label={`Teks pilihan ${OPTION_LABELS[index]}`}
                placeholder={`Pilihan ${OPTION_LABELS[index]}`}
                onChange={(event) =>
                  setOptions((prev) =>
                    prev.map((o) =>
                      o.id === option.id ? { ...o, text: event.target.value } : o,
                    ),
                  )
                }
                onKeyDown={(event) => {
                  // Enter di pilihan terakhir menambah pilihan baru, bukan
                  // mengirim form.
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (index === options.length - 1 && canAddOption) addOption();
                    else {
                      const next = options[index + 1];
                      if (next) optionRefs.current.get(next.id)?.focus();
                    }
                  }
                }}
                className={cn(
                  inputClass,
                  isCorrect && "border-isg-ok/50 bg-isg-ok/5 font-semibold",
                )}
              />

              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={options.length <= 2}
                aria-label={`Hapus pilihan ${OPTION_LABELS[index]}`}
                title={options.length <= 2 ? "Minimal 2 pilihan" : "Hapus pilihan"}
                className={iconButton}
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          );
        })}

        {canAddOption ? (
          <button
            type="button"
            onClick={addOption}
            className="ml-15 flex w-fit items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-bold text-isg-blue transition-colors hover:bg-isg-blue/10"
          >
            <Plus size={14} aria-hidden />
            Tambah pilihan
          </button>
        ) : null}

        {!correct ? (
          <p className="ml-15 text-xs font-semibold text-isg-warn">
            Belum ada jawaban benar yang ditandai.
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-isg-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-bold text-isg-ink">
          Poin
          <input
            name="points"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            required
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            className={cn(inputClass, "w-20 text-center")}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-isg-line px-4 py-2.5 text-sm font-bold text-isg-ink hover:bg-isg-tint"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending || !correct}
            className="flex items-center gap-2 rounded-xl bg-isg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-isg-blue-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 size={15} aria-hidden className="animate-spin" /> : null}
            {isPending ? "Menyimpan..." : question ? "Simpan Perubahan" : "Simpan Soal"}
          </button>
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
    </form>
  );
}
