"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import {
  gradeSubmission,
  type AssignmentFormState,
} from "@/features/assignment/actions/assignment-actions";
import {
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  formatDeadline,
} from "@/features/assignment/types";
import type { SubmissionStatus } from "@prisma/client";
import { cn } from "@/utils/cn";

export type SubmissionRow = {
  id: string;
  fileUrl: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
  participant: { id: string; studentId: string; user: { name: string } };
};

export function GradeList({ submissions }: { submissions: SubmissionRow[] }) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-isg-line bg-isg-surface p-12 text-center text-sm text-isg-muted">
        Belum ada peserta yang mengumpulkan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {submissions.map((submission) => (
        <GradeCard key={submission.id} submission={submission} />
      ))}
    </ul>
  );
}

function GradeCard({ submission }: { submission: SubmissionRow }) {
  const [state, formAction, isPending] = useActionState(gradeSubmission, {});
  const [dirty, setDirty] = useState(false);
  // Diturunkan, bukan disalin lewat useEffect: menyalin state action ke state
  // React memicu render berantai dan ditolak aturan React Compiler.
  const showSaved = Boolean(state.success) && !dirty;
  const alreadyGraded = submission.score !== null || Boolean(state.success);

  return (
    <li className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-isg-ink">{submission.participant.user.name}</span>
          <span className="font-mono text-xs text-isg-muted">
            {submission.participant.studentId}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              SUBMISSION_STATUS_TONE[submission.status],
            )}
          >
            {SUBMISSION_STATUS_LABEL[submission.status]}
          </span>
        </div>

        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 truncate text-sm font-semibold text-isg-blue hover:underline"
        >
          <ExternalLink size={14} aria-hidden className="shrink-0" />
          {submission.fileUrl}
        </a>

        <p className="text-xs text-isg-muted">
          Dikumpulkan {formatDeadline(submission.submittedAt)}
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={() => setDirty(false)}
        className="flex shrink-0 flex-col gap-2 lg:w-72"
      >
        <input type="hidden" name="submissionId" value={submission.id} />
        <div className="flex gap-2">
          <input
            name="score"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={submission.score ?? ""}
            placeholder="Nilai"
            onChange={() => setDirty(true)}
            className="h-11 w-24 rounded-xl border border-isg-line bg-isg-surface px-3 text-sm font-bold text-isg-ink outline-none focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
          />
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "h-11 flex-1 rounded-xl bg-isg-blue text-sm font-bold text-white transition-colors hover:bg-isg-blue-deep",
              isPending && "cursor-not-allowed opacity-70",
            )}
          >
            {isPending ? "Menyimpan..." : alreadyGraded ? "Perbarui" : "Simpan Nilai"}
          </button>
        </div>

        <textarea
          name="feedback"
          rows={2}
          defaultValue={submission.feedback ?? ""}
          placeholder="Catatan untuk peserta (opsional)"
          onChange={() => setDirty(true)}
          className="w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 py-2.5 text-sm text-isg-ink outline-none focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
        />

        {state.error ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-isg-bad">
            <CircleAlert size={13} aria-hidden />
            {state.error}
          </p>
        ) : showSaved ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-isg-ok">
            <CheckCircle2 size={13} aria-hidden />
            Nilai tersimpan.
          </p>
        ) : null}
      </form>
    </li>
  );
}
