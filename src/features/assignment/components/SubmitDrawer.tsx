"use client";

import { useActionState, useEffect } from "react";
import { CircleAlert, ExternalLink, Info } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  submitAssignment,
  type AssignmentFormState,
} from "@/features/assignment/actions/assignment-actions";
import {
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  formatDeadline,
  isOverdue,
  type AssignmentRow,
} from "@/features/assignment/types";
import { cn } from "@/utils/cn";

const initialState: AssignmentFormState = {};

export function SubmitDrawer({
  assignment,
  onClose,
}: {
  assignment: AssignmentRow;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(submitAssignment, initialState);
  const sub = assignment.mySubmission;
  const overdue = isOverdue(assignment.deadline);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Drawer
      title={assignment.title}
      description={`Batas ${formatDeadline(assignment.deadline)}`}
      onClose={onClose}
    >
      <div className="flex flex-1 flex-col gap-5">
        <div className="whitespace-pre-wrap rounded-card bg-isg-tint p-4 text-sm text-isg-ink-soft">
          {assignment.description}
        </div>

        {sub ? (
          <div className="flex flex-col gap-2 rounded-card border border-isg-line p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-isg-ink">
                Pengumpulanmu
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  SUBMISSION_STATUS_TONE[sub.status],
                )}
              >
                {SUBMISSION_STATUS_LABEL[sub.status]}
              </span>
            </div>
            <a
              href={sub.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 truncate text-sm font-semibold text-isg-blue hover:underline"
            >
              <ExternalLink size={14} aria-hidden className="shrink-0" />
              {sub.fileUrl}
            </a>
            {sub.score !== null ? (
              <p className="text-sm text-isg-ink-soft">
                Nilai: <strong className="text-isg-ink">{sub.score}</strong>
              </p>
            ) : null}
            {sub.feedback ? (
              <p className="rounded-xl bg-isg-tint p-3 text-sm text-isg-ink-soft">
                &ldquo;{sub.feedback}&rdquo;
              </p>
            ) : null}
          </div>
        ) : null}

        {overdue ? (
          <p className="flex items-start gap-2 rounded-card border border-isg-warn/30 bg-isg-warn/5 p-3.5 text-sm text-isg-ink-soft">
            <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-isg-warn" />
            Batas waktu sudah lewat. Pengumpulanmu tetap diterima, tapi akan ditandai
            terlambat.
          </p>
        ) : null}

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="assignmentId" value={assignment.id} />

          <label htmlFor="s-url" className="text-sm font-bold text-isg-ink">
            Tautan Pengumpulan
          </label>
          <input
            id="s-url"
            name="fileUrl"
            type="url"
            required
            defaultValue={sub?.fileUrl ?? ""}
            placeholder="https://drive.google.com/... atau https://github.com/..."
            className="h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
          />
          <p className="text-xs text-isg-muted">
            Unggah pekerjaanmu ke Google Drive atau GitHub, lalu tempel tautannya di
            sini. Pastikan aksesnya terbuka agar mentor bisa membuka.
          </p>

          {sub ? (
            <p className="text-xs text-isg-warn">
              Mengumpulkan ulang akan menghapus nilai dan catatan mentor sebelumnya.
            </p>
          ) : null}

          {state.error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-isg-bad/25 bg-isg-bad/5 px-3.5 py-2.5 text-sm text-isg-bad"
            >
              <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "mt-1 flex h-12 items-center justify-center rounded-full bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
              isPending && "cursor-not-allowed opacity-70",
            )}
          >
            {isPending ? "Mengirim..." : sub ? "Kumpulkan Ulang" : "Kumpulkan"}
          </button>
        </form>
      </div>
    </Drawer>
  );
}
