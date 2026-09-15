"use client";

import { useActionState, useEffect, useState } from "react";
import { Mail, UserRound } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/utils/cn";
import { formatDateID } from "@/utils/format-date";
import { ACCOUNT_STATUS_META } from "@/features/verification/status-meta";
import {
  rejectApplicant,
  requestRevision,
  verifyApplicant,
  type VerificationFormState,
} from "@/features/verification/actions/verification-actions";
import type { ApplicantWithRelations, BatchOption } from "@/features/verification/types";

const initialState: VerificationFormState = {};

type ActiveAction = "verify" | "reject" | "revision" | null;

export function ApplicantDetailDrawer({
  applicant,
  batches,
  onClose,
  onDone,
}: {
  applicant: ApplicantWithRelations;
  batches: BatchOption[];
  onClose: () => void;
  /** Dipanggil setelah aksi berhasil: drawer ditutup dan toast ditampilkan. */
  onDone: (msg: { tone: "success" | "error"; title: string; description?: string }) => void;
}) {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const canAct = applicant.user.status === "PENDING" || applicant.user.status === "REVISION_REQUIRED";
  const meta = ACCOUNT_STATUS_META[applicant.user.status];

  return (
    <Drawer
      title={applicant.user.name}
      description={`No. Pendaftaran ${applicant.registrationNumber}`}
      onClose={onClose}
    >
      <div className="flex flex-1 flex-col gap-6">
        {/* Foto profil yang diunggah pendaftar, supaya Admin bisa mencocokkan
            wajah dengan data kampus sebelum memverifikasi. */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-isg-tint ring-1 ring-isg-line">
            {applicant.user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL, bukan berkas statis
              <img
                src={applicant.user.photoUrl}
                alt={`Foto ${applicant.user.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-isg-muted">
                <UserRound size={30} aria-hidden />
                <span className="sr-only">Belum mengunggah foto</span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <span
              className={cn(
                "inline-block w-fit rounded-full px-2.5 py-1 text-xs font-bold",
                meta.bg,
                meta.color,
              )}
            >
              {meta.title}
            </span>
            <p className="mt-1.5 truncate text-sm text-isg-muted">
              {applicant.user.email}
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold text-isg-ink">Data Pendaftar</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info label="NIM" value={applicant.studentId} />
            <Info label="Telepon" value={applicant.user.phone ?? "-"} />
            <Info label="Semester" value={`Semester ${applicant.semester}`} />
            <Info label="Program Studi" value={applicant.studyProgram} />
            <Info label="Tanggal Daftar" value={formatDateID(applicant.registeredAt)} />
            <Info label="Angkatan" value={applicant.batch?.name ?? "Belum ditentukan"} />
          </dl>
        </section>

        {applicant.techInterests.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-isg-ink">Minat Teknologi</h3>
            <div className="flex flex-wrap gap-1.5">
              {applicant.techInterests.map((interest) => (
                <span key={interest} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs text-isg-ink">
                  {interest}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {applicant.reason ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-isg-ink">Alasan Bergabung</h3>
            <p className="text-sm text-isg-muted">{applicant.reason}</p>
          </section>
        ) : null}

        {applicant.verificationLogs.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-isg-ink">Riwayat Verifikasi</h3>
            <div className="flex flex-col gap-2">
              {applicant.verificationLogs.map((log) => (
                <div key={log.id} className="rounded-xl bg-isg-tint p-3 text-sm">
                  <p className="font-medium text-isg-ink">{ACCOUNT_STATUS_META[log.status].title}</p>
                  {log.note ? <p className="mt-0.5 text-isg-muted">{log.note}</p> : null}
                  <p className="mt-1 text-xs text-isg-muted">{formatDateID(log.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {canAct ? (
          <section className="mt-auto flex flex-col gap-3 border-t border-isg-line pt-4">
            {activeAction === null ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAction("verify")}
                  className="rounded-xl bg-isg-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a6fc7]"
                >
                  Verifikasi Pendaftar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction("revision")}
                    className="flex-1 rounded-xl border border-isg-line px-4 py-2.5 text-sm font-medium text-isg-ink hover:bg-isg-tint"
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAction("reject")}
                    className="flex-1 rounded-xl border border-[#E5484D]/30 px-4 py-2.5 text-sm font-medium text-isg-bad hover:bg-isg-bad/5"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ) : null}

            {activeAction === "verify" ? (
              <VerifyForm
                applicant={applicant}
                batches={batches}
                onCancel={() => setActiveAction(null)}
                onDone={onDone}
              />
            ) : null}
            {activeAction === "reject" ? (
              <NoteActionForm
                applicant={applicant}
                action={rejectApplicant}
                onDone={onDone}
                doneTitle="Pendaftar ditolak"
                label="Tolak Pendaftar"
                placeholder="Jelaskan alasan penolakan..."
                isDanger
                onCancel={() => setActiveAction(null)}
              />
            ) : null}
            {activeAction === "revision" ? (
              <NoteActionForm
                applicant={applicant}
                action={requestRevision}
                onDone={onDone}
                doneTitle="Permintaan revisi dikirim"
                label="Kirim Permintaan Revisi"
                placeholder="Jelaskan data apa yang perlu diperbaiki..."
                onCancel={() => setActiveAction(null)}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </Drawer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-isg-muted">{label}</dt>
      <dd className="font-medium text-isg-ink">{value}</dd>
    </div>
  );
}

function VerifyForm({
  applicant,
  batches,
  onCancel,
  onDone,
}: {
  applicant: ApplicantWithRelations;
  batches: BatchOption[];
  onCancel: () => void;
  onDone: (msg: { tone: "success" | "error"; title: string; description?: string }) => void;
}) {
  const [state, formAction, isPending] = useActionState(verifyApplicant, initialState);

  useEffect(() => {
    if (state.success)
      onDone({
        tone: "success",
        title: "Peserta berhasil diverifikasi",
        description: `Email berisi rincian akun sudah dikirim ke ${applicant.user.email}.`,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl bg-isg-tint p-4">
      <input type="hidden" name="participantId" value={applicant.id} />

      {/* Banner informasi pengiriman email */}
      <div className="flex items-start gap-2.5 rounded-xl border border-isg-blue/20 bg-isg-blue/10 p-3 text-xs text-isg-ink">
        <Mail size={16} className="mt-0.5 shrink-0 text-isg-blue" aria-hidden />
        <p className="leading-relaxed">
          Email konfirmasi penerimaan dan rincian login (NIM &amp; Kata Sandi) akan otomatis dikirim ke{" "}
          <strong className="font-semibold text-isg-blue-deep">{applicant.user.email}</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="batchId" className="text-sm font-medium text-isg-ink">
          Tempatkan ke Angkatan
        </label>
        <select id="batchId" name="batchId" required className={fieldClass}>
          <option value="">Pilih angkatan</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      <p className="rounded-xl border border-isg-line bg-white p-3 text-xs leading-relaxed text-isg-muted">
        Sistem akan membuat kata sandi sementara secara otomatis dan mengirimkannya bersama email penerimaan.
        Peserta wajib menggantinya saat login pertama.
      </p>

      <textarea name="note" rows={2} placeholder="Catatan untuk peserta (opsional)" className={cn(fieldClass, "h-auto py-2")} />

      {state.error ? <p className="text-sm text-isg-bad">{state.error}</p> : null}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-isg-line px-3.5 py-2 text-sm font-medium text-isg-ink hover:bg-isg-tint"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl bg-isg-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-isg-blue-deep",
            isPending && "opacity-70",
          )}
        >
          {isPending ? "Memproses..." : "Konfirmasi & Kirim Email"}
        </button>
      </div>
    </form>
  );
}

function NoteActionForm({
  applicant,
  action,
  label,
  placeholder,
  isDanger,
  onCancel,
  onDone,
  doneTitle,
}: {
  applicant: ApplicantWithRelations;
  action: (prevState: VerificationFormState, formData: FormData) => Promise<VerificationFormState>;
  label: string;
  placeholder: string;
  isDanger?: boolean;
  onCancel: () => void;
  onDone: (msg: { tone: "success" | "error"; title: string; description?: string }) => void;
  doneTitle: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success)
      onDone({
        tone: "success",
        title: doneTitle,
        description: `Pemberitahuan sudah dikirim ke ${applicant.user.email}.`,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl bg-isg-tint p-4">
      <input type="hidden" name="participantId" value={applicant.id} />
      <textarea name="note" rows={3} required placeholder={placeholder} className={cn(fieldClass, "h-auto py-2")} />
      {state.error ? <p className="text-sm text-isg-bad">{state.error}</p> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-isg-line px-3.5 py-2 text-sm font-medium text-isg-ink">
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl px-3.5 py-2 text-sm font-semibold text-white",
            isDanger ? "bg-isg-bad" : "bg-isg-blue",
            isPending && "opacity-70",
          )}
        >
          {isPending ? "Memproses..." : label}
        </button>
      </div>
    </form>
  );
}

const fieldClass =
  "h-10 rounded-xl border border-isg-line bg-white px-3.5 text-sm text-isg-ink outline-none focus:border-[#0C81E4] focus:ring-2 focus:ring-[#0C81E4]/20";
