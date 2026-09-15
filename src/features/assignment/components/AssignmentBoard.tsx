"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { AssignmentFormDrawer } from "@/features/assignment/components/AssignmentFormDrawer";
import { SubmitDrawer } from "@/features/assignment/components/SubmitDrawer";
import { deleteAssignment } from "@/features/assignment/actions/assignment-actions";
import {
  ASSIGNMENT_CATEGORY_LABEL,
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  formatDeadline,
  isOverdue,
  type AssignmentRow,
  type MeetingOption,
} from "@/features/assignment/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";

export function AssignmentBoard({
  assignments,
  meetings,
  canManage,
  totalParticipants,
}: {
  assignments: AssignmentRow[];
  meetings: MeetingOption[];
  canManage: boolean;
  totalParticipants: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AssignmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState<AssignmentRow | null>(null);
  const [removing, setRemoving] = useState<AssignmentRow | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  async function confirmRemove() {
    if (!removing) return;
    setIsRemoving(true);
    setRemoveError("");
    const result = await deleteAssignment(removing.id);
    setIsRemoving(false);
    if (result.error) {
      setRemoveError(result.error);
      return;
    }
    setRemoving(null);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Tugas</h1>
          <p className="text-sm text-isg-muted">
            {assignments.length} tugas
            {canManage ? "" : " untuk angkatanmu"}.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-fit items-center gap-2 rounded-full bg-isg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
          >
            <Plus size={16} aria-hidden />
            Tambah Tugas
          </button>
        ) : null}
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <FileText size={32} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum ada tugas</p>
          <p className="max-w-xs text-sm text-isg-muted">
            {canManage
              ? "Tambahkan tugas pertama untuk pesertamu."
              : "Mentor belum memberikan tugas."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((item) => {
            const overdue = isOverdue(item.deadline);
            const sub = item.mySubmission;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-isg-blue/10 px-2.5 py-1 text-xs font-bold text-isg-blue">
                      {ASSIGNMENT_CATEGORY_LABEL[item.category]}
                    </span>
                    {item.meeting ? (
                      <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
                        {item.meeting.title}
                      </span>
                    ) : null}
                    {!canManage && sub ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          SUBMISSION_STATUS_TONE[sub.status],
                        )}
                      >
                        {SUBMISSION_STATUS_LABEL[sub.status]}
                        {sub.score !== null ? ` · ${sub.score}` : ""}
                      </span>
                    ) : null}
                    {!canManage && !sub && overdue ? (
                      <span className="rounded-full bg-isg-bad/10 px-2.5 py-1 text-xs font-bold text-isg-bad">
                        Lewat batas
                      </span>
                    ) : null}
                  </div>

                  <h2 className="truncate text-lg font-extrabold tracking-tight text-isg-ink">
                    {item.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-isg-muted">
                    <span
                      className={cn(
                        "flex items-center gap-1.5",
                        overdue && !sub && !canManage && "font-semibold text-isg-bad",
                      )}
                    >
                      <CalendarClock size={14} aria-hidden />
                      Batas {formatDeadline(item.deadline)}
                    </span>
                    {canManage ? (
                      <span className="flex items-center gap-1.5">
                        <Users size={14} aria-hidden />
                        {item._count.submissions}/{totalParticipants} terkumpul
                      </span>
                    ) : null}
                    {item.attachmentUrl ? (
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 font-semibold text-isg-blue hover:underline"
                      >
                        <Paperclip size={14} aria-hidden />
                        Lampiran
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {canManage ? (
                    <>
                      <Link
                        href={`/dashboard/tugas/${item.id}`}
                        className="rounded-full bg-isg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-navy"
                      >
                        Nilai
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`Ubah ${item.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-blue"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveError("");
                          setRemoving(item);
                        }}
                        aria-label={`Hapus ${item.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-bad/10 hover:text-isg-bad"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSubmitting(item)}
                      className={cn(
                        "rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                        sub
                          ? "border border-isg-line text-isg-ink hover:bg-isg-tint"
                          : "bg-isg-blue text-white shadow-lift hover:bg-isg-blue-deep",
                      )}
                    >
                      {sub ? "Lihat / Ganti" : "Kumpulkan"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating ? (
        <AssignmentFormDrawer
          assignment={null}
          meetings={meetings}
          onClose={() => setCreating(false)}
        />
      ) : null}
      {editing ? (
        <AssignmentFormDrawer
          assignment={editing}
          meetings={meetings}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {submitting ? (
        <SubmitDrawer assignment={submitting} onClose={() => setSubmitting(null)} />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Hapus tugas?"
          description={`"${removing.title}" beserta seluruh pengumpulan peserta akan dihapus permanen.`}
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
