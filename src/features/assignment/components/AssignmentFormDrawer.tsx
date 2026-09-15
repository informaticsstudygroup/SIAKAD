"use client";

import { useActionState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  saveAssignment,
  type AssignmentFormState,
} from "@/features/assignment/actions/assignment-actions";
import {
  ASSIGNMENT_CATEGORY_LABEL,
  type AssignmentRow,
  type MeetingOption,
} from "@/features/assignment/types";
import { cn } from "@/utils/cn";

const initialState: AssignmentFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDateValue(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}
function toTimeValue(d: Date) {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function AssignmentFormDrawer({
  assignment,
  meetings,
  onClose,
}: {
  assignment: AssignmentRow | null;
  meetings: MeetingOption[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveAssignment, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Drawer
      title={assignment ? "Ubah Tugas" : "Tambah Tugas"}
      description="Peserta akan melihat tugas ini beserta batas waktunya."
      onClose={onClose}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {assignment ? <input type="hidden" name="id" value={assignment.id} /> : null}

        <Field label="Judul" htmlFor="a-title">
          <input
            id="a-title"
            name="title"
            required
            defaultValue={assignment?.title ?? ""}
            placeholder="Contoh: Membuat Halaman Profil dengan HTML & CSS"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="a-category">
            <select
              id="a-category"
              name="category"
              required
              defaultValue={assignment?.category ?? "TUGAS"}
              className={inputClass}
            >
              {Object.entries(ASSIGNMENT_CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Terkait Pertemuan" htmlFor="a-meeting" optional>
            <select
              id="a-meeting"
              name="meetingId"
              defaultValue={assignment?.meeting?.id ?? ""}
              className={inputClass}
            >
              <option value="">Tidak terkait pertemuan</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Batas Tanggal" htmlFor="a-date">
            <input
              id="a-date"
              name="deadlineDate"
              type="date"
              required
              defaultValue={assignment ? toDateValue(assignment.deadline) : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Batas Jam" htmlFor="a-time">
            <input
              id="a-time"
              name="deadlineTime"
              type="time"
              required
              defaultValue={assignment ? toTimeValue(assignment.deadline) : "23:59"}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Deskripsi & Instruksi" htmlFor="a-desc">
          <textarea
            id="a-desc"
            name="description"
            required
            rows={5}
            defaultValue={assignment?.description ?? ""}
            placeholder="Jelaskan apa yang harus dikerjakan dan bagaimana cara mengumpulkannya."
            className={cn(inputClass, "h-auto py-3")}
          />
        </Field>

        <Field label="Tautan Lampiran" htmlFor="a-attach" optional>
          <input
            id="a-attach"
            name="attachmentUrl"
            type="url"
            defaultValue={assignment?.attachmentUrl ?? ""}
            placeholder="https://drive.google.com/..."
            className={inputClass}
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
