"use client";

import { useActionState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  saveMeeting,
  type MeetingFormState,
} from "@/features/schedule/actions/meeting-actions";
import {
  MEETING_CATEGORY_LABEL,
  type BatchOption,
  type MeetingRow,
} from "@/features/schedule/types";
import { cn } from "@/utils/cn";

const initialState: MeetingFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

/** Date -> "YYYY-MM-DD" dan "HH:mm" memakai jam lokal, bukan UTC. */
function toDateValue(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeValue(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingFormDrawer({
  meeting,
  batches,
  onClose,
}: {
  meeting: MeetingRow | null;
  batches: BatchOption[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveMeeting, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Drawer
      title={meeting ? "Ubah Pertemuan" : "Tambah Pertemuan"}
      description="Peserta akan melihat jadwal ini di dashboard mereka."
      onClose={onClose}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {meeting ? <input type="hidden" name="id" value={meeting.id} /> : null}

        <Field label="Judul Pertemuan" htmlFor="m-title">
          <input
            id="m-title"
            name="title"
            required
            defaultValue={meeting?.title ?? ""}
            placeholder="Contoh: Dasar HTML & Struktur Halaman"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="m-category">
            <select
              id="m-category"
              name="category"
              required
              defaultValue={meeting?.category ?? "KELAS"}
              className={inputClass}
            >
              {Object.entries(MEETING_CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Angkatan" htmlFor="m-batch">
            <select
              id="m-batch"
              name="batchId"
              required
              defaultValue={meeting?.batchId ?? ""}
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
        </div>

        <Field label="Tanggal" htmlFor="m-date">
          <input
            id="m-date"
            name="date"
            type="date"
            required
            defaultValue={meeting ? toDateValue(meeting.date) : ""}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Jam Mulai" htmlFor="m-start">
            <input
              id="m-start"
              name="startTime"
              type="time"
              required
              defaultValue={meeting ? toTimeValue(meeting.startTime) : "19:00"}
              className={inputClass}
            />
          </Field>
          <Field label="Jam Selesai" htmlFor="m-end">
            <input
              id="m-end"
              name="endTime"
              type="time"
              required
              defaultValue={meeting ? toTimeValue(meeting.endTime) : "21:00"}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Lokasi" htmlFor="m-location" optional>
          <input
            id="m-location"
            name="location"
            defaultValue={meeting?.location ?? ""}
            placeholder="Contoh: Lab Informatika 2"
            className={inputClass}
          />
        </Field>

        <Field label="Tautan Daring" htmlFor="m-link" optional>
          <input
            id="m-link"
            name="meetingLink"
            type="url"
            defaultValue={meeting?.meetingLink ?? ""}
            placeholder="https://meet.google.com/..."
            className={inputClass}
          />
        </Field>

        <Field label="Deskripsi" htmlFor="m-desc" optional>
          <textarea
            id="m-desc"
            name="description"
            rows={3}
            defaultValue={meeting?.description ?? ""}
            placeholder="Apa yang akan dibahas di pertemuan ini..."
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
