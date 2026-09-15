"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, HelpCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { QuizFormDrawer } from "@/features/quiz/components/QuizFormDrawer";
import { deleteQuiz } from "@/features/quiz/actions/quiz-actions";
import {
  QUIZ_STATUS_LABEL,
  QUIZ_STATUS_TONE,
  formatQuizWindow,
  isQuizOpen,
  type QuizRow,
} from "@/features/quiz/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";

export function QuizBoard({
  quizzes,
  batches,
  canManage,
}: {
  quizzes: QuizRow[];
  batches: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<QuizRow | null>(null);
  const [removing, setRemoving] = useState<QuizRow | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  async function confirmRemove() {
    if (!removing) return;
    setIsRemoving(true);
    setRemoveError("");
    const result = await deleteQuiz(removing.id);
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
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Kuis</h1>
          <p className="text-sm text-isg-muted">
            {quizzes.length} kuis{canManage ? "" : " untuk angkatanmu"}.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={batches.length === 0}
            className={cn(
              "flex w-fit items-center gap-2 rounded-full bg-isg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
              batches.length === 0 && "cursor-not-allowed opacity-60",
            )}
          >
            <Plus size={16} aria-hidden />
            Tambah Kuis
          </button>
        ) : null}
      </div>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <HelpCircle size={32} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum ada kuis</p>
          <p className="max-w-xs text-sm text-isg-muted">
            {canManage
              ? "Buat kuis pertama, tambahkan soalnya, lalu aktifkan."
              : "Mentor belum membuka kuis untuk angkatanmu."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {quizzes.map((quiz) => {
            const open = isQuizOpen(quiz);
            const attempt = quiz.myAttempt;
            const submitted = Boolean(attempt?.submittedAt);
            return (
              <li
                key={quiz.id}
                className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        QUIZ_STATUS_TONE[quiz.status],
                      )}
                    >
                      {QUIZ_STATUS_LABEL[quiz.status]}
                    </span>
                    <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
                      {quiz.batch.name}
                    </span>
                    {submitted ? (
                      <span className="rounded-full bg-isg-ok/10 px-2.5 py-1 text-xs font-bold text-isg-ok">
                        Nilai {attempt?.score}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="truncate text-lg font-extrabold tracking-tight text-isg-ink">
                    {quiz.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-isg-muted">
                    <span>{quiz.topic}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} aria-hidden />
                      {quiz.durationMinutes} menit ·{" "}
                      {formatQuizWindow(quiz.startAt, quiz.endAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={14} aria-hidden />
                      {quiz._count.questions} soal
                    </span>
                    {canManage ? (
                      <span className="flex items-center gap-1.5">
                        <Users size={14} aria-hidden />
                        {quiz._count.attempts} mengerjakan
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {canManage ? (
                    <>
                      <Link
                        href={`/dashboard/kuis/${quiz.id}`}
                        className="rounded-full bg-isg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-navy"
                      >
                        Kelola Soal
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(quiz)}
                        aria-label={`Ubah ${quiz.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-blue"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveError("");
                          setRemoving(quiz);
                        }}
                        aria-label={`Hapus ${quiz.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-bad/10 hover:text-isg-bad"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </>
                  ) : submitted ? (
                    <span className="rounded-full bg-isg-tint px-5 py-2.5 text-sm font-bold text-isg-muted">
                      Sudah dikerjakan
                    </span>
                  ) : open && quiz._count.questions > 0 ? (
                    <Link
                      href={`/dashboard/kuis/${quiz.id}/kerjakan`}
                      className="rounded-full bg-isg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
                    >
                      Kerjakan
                    </Link>
                  ) : (
                    <span className="rounded-full border border-isg-line px-5 py-2.5 text-sm font-bold text-isg-muted">
                      {quiz._count.questions === 0 ? "Belum ada soal" : "Belum dibuka"}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating ? (
        <QuizFormDrawer quiz={null} batches={batches} onClose={() => setCreating(false)} />
      ) : null}
      {editing ? (
        <QuizFormDrawer
          quiz={editing}
          batches={batches}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Hapus kuis?"
          description={`"${removing.title}" beserta soal dan hasil pengerjaan peserta akan dihapus permanen.`}
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
