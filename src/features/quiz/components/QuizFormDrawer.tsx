"use client";

import { useActionState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { saveQuiz, type QuizFormState } from "@/features/quiz/actions/quiz-actions";
import { QUIZ_STATUS_LABEL, type QuizRow } from "@/features/quiz/types";
import { cn } from "@/utils/cn";

const initialState: QuizFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
const toTime = (d: Date) => {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export function QuizFormDrawer({
  quiz,
  batches,
  onClose,
}: {
  quiz: QuizRow | null;
  batches: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveQuiz, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Drawer
      title={quiz ? "Ubah Kuis" : "Tambah Kuis"}
      description="Simpan sebagai draf dulu, aktifkan setelah soalnya lengkap."
      onClose={onClose}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {quiz ? <input type="hidden" name="id" value={quiz.id} /> : null}

        <Field label="Judul Kuis" htmlFor="q-title">
          <input
            id="q-title"
            name="title"
            required
            defaultValue={quiz?.title ?? ""}
            placeholder="Contoh: Kuis Dasar HTML"
            className={inputClass}
          />
        </Field>

        <Field label="Topik" htmlFor="q-topic">
          <input
            id="q-topic"
            name="topic"
            required
            defaultValue={quiz?.topic ?? ""}
            placeholder="HTML & Struktur Halaman"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Angkatan" htmlFor="q-batch">
            <select
              id="q-batch"
              name="batchId"
              required
              defaultValue={quiz?.batch.id ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                Pilih angkatan
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Durasi (menit)" htmlFor="q-duration">
            <input
              id="q-duration"
              name="durationMinutes"
              type="number"
              min={1}
              max={300}
              required
              defaultValue={quiz?.durationMinutes ?? 30}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mulai Tanggal" htmlFor="q-sd">
            <input
              id="q-sd"
              name="startDate"
              type="date"
              required
              defaultValue={quiz ? toDate(quiz.startAt) : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Mulai Jam" htmlFor="q-st">
            <input
              id="q-st"
              name="startTime"
              type="time"
              required
              defaultValue={quiz ? toTime(quiz.startAt) : "19:00"}
              className={inputClass}
            />
          </Field>
          <Field label="Akhir Tanggal" htmlFor="q-ed">
            <input
              id="q-ed"
              name="endDate"
              type="date"
              required
              defaultValue={quiz ? toDate(quiz.endAt) : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Akhir Jam" htmlFor="q-et">
            <input
              id="q-et"
              name="endTime"
              type="time"
              required
              defaultValue={quiz ? toTime(quiz.endAt) : "21:00"}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Status" htmlFor="q-status">
          <select
            id="q-status"
            name="status"
            required
            defaultValue={quiz?.status ?? "DRAFT"}
            className={inputClass}
          >
            {Object.entries(QUIZ_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Instruksi" htmlFor="q-inst" optional>
          <textarea
            id="q-inst"
            name="instructions"
            rows={3}
            defaultValue={quiz?.instructions ?? ""}
            placeholder="Hal yang perlu diperhatikan peserta sebelum mulai."
            className={cn(inputClass, "h-auto py-3")}
          />
        </Field>

        {state.error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-isg-bad/25 bg-isg-bad/5 px-3.5 py-2.5 text-sm text-isg-bad"
          >
            <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
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
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-isg-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-medium text-isg-muted">(opsional)</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
