import type { AssignmentCategory, SubmissionStatus } from "@prisma/client";

export type AssignmentRow = {
  id: string;
  title: string;
  category: AssignmentCategory;
  description: string;
  deadline: Date;
  attachmentUrl: string | null;
  meeting: { id: string; title: string } | null;
  _count: { submissions: number };
  /** Hanya diisi untuk peserta: pengumpulan miliknya sendiri. */
  mySubmission?: {
    id: string;
    fileUrl: string;
    status: SubmissionStatus;
    score: number | null;
    feedback: string | null;
    submittedAt: Date;
  } | null;
};

export type MeetingOption = { id: string; title: string };

export const ASSIGNMENT_CATEGORY_LABEL: Record<AssignmentCategory, string> = {
  TUGAS: "Tugas",
  PROYEK: "Proyek",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  BELUM_DIKUMPULKAN: "Belum dikumpulkan",
  SUDAH_DIKUMPULKAN: "Sudah dikumpulkan",
  TERLAMBAT: "Terlambat",
  SUDAH_DINILAI: "Sudah dinilai",
};

export const SUBMISSION_STATUS_TONE: Record<SubmissionStatus, string> = {
  BELUM_DIKUMPULKAN: "bg-isg-tint text-isg-muted",
  SUDAH_DIKUMPULKAN: "bg-isg-blue/10 text-isg-blue",
  TERLAMBAT: "bg-isg-warn/12 text-isg-warn",
  SUDAH_DINILAI: "bg-isg-ok/10 text-isg-ok",
};

/** "15 Sep 2026, 23:59" */
export function formatDeadline(date: Date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(deadline: Date) {
  return new Date() > new Date(deadline);
}
