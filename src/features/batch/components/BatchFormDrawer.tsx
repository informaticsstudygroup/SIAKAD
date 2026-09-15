"use client";

import { useActionState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/utils/cn";
import { toDateInputValue } from "@/utils/format-date";
import { saveBatch, type BatchFormState } from "@/features/batch/actions/batch-actions";
import type { BatchWithRelations, MentorOption } from "@/features/batch/types";

const initialState: BatchFormState = {};

export function BatchFormDrawer({
  batch,
  mentors,
  coMentors,
  onClose,
}: {
  batch: BatchWithRelations | null;
  mentors: MentorOption[];
  coMentors: MentorOption[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(saveBatch, initialState);

  useEffect(() => {
    if (state.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Drawer
      title={batch ? "Ubah Angkatan" : "Tambah Angkatan"}
      description="Atur nama, periode, kapasitas, dan mentor pengampu angkatan."
      onClose={onClose}
    >
      <form action={formAction} className="flex flex-1 flex-col gap-4">
        {batch ? <input type="hidden" name="id" value={batch.id} /> : null}

        <Field label="Nama Angkatan" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={batch?.name}
            placeholder="Angkatan 10"
            className={inputClass}
          />
        </Field>

        <Field label="Periode" htmlFor="period">
          <input
            id="period"
            name="period"
            required
            defaultValue={batch?.period}
            placeholder="Ganjil 2026/2027"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal Mulai" htmlFor="startDate">
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={batch ? toDateInputValue(batch.startDate) : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Tanggal Selesai" htmlFor="endDate">
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              defaultValue={batch ? toDateInputValue(batch.endDate) : undefined}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Kapasitas Peserta" htmlFor="capacity">
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            required
            defaultValue={batch?.capacity}
            className={inputClass}
          />
        </Field>

        <Field label="Mentor" htmlFor="mentorId">
          <select id="mentorId" name="mentorId" defaultValue={batch?.mentorId ?? ""} className={inputClass}>
            <option value="">Belum ditentukan</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Co-Mentor" htmlFor="coMentorId">
          <select id="coMentorId" name="coMentorId" defaultValue={batch?.coMentorId ?? ""} className={inputClass}>
            <option value="">Belum ditentukan</option>
            {coMentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm text-[#102033]">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={batch?.isActive ?? true}
            className="h-4 w-4 rounded border-[#E2E8F0] text-[#0C81E4]"
          />
          Angkatan aktif
        </label>

        {state.error ? (
          <p role="alert" className="rounded-xl border border-[#E5484D]/30 bg-[#E5484D]/5 px-4 py-2.5 text-sm text-[#E5484D]">
            {state.error}
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#102033] hover:bg-[#F7FAFC]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "rounded-xl bg-[#0C81E4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a6fc7]",
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

const inputClass =
  "h-11 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#102033] outline-none transition-colors focus:border-[#0C81E4] focus:ring-2 focus:ring-[#0C81E4]/20";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#102033]">
        {label}
      </label>
      {children}
    </div>
  );
}
