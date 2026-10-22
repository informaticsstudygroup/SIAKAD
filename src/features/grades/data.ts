import { prisma } from "@/lib/prisma";
import {
  columnKey,
  type GradeCell,
  type GradeColumn,
  type GradeSheetData,
} from "@/features/grades/types";

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/** Kuis dan tugas yang dinilai untuk satu angkatan, urut menurut waktunya. */
export async function loadGradeColumns(batchId: string) {
  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { batchId, status: { not: "DRAFT" } },
      select: { id: true, title: true, startAt: true },
      orderBy: { startAt: "asc" },
    }),
    // Tugas tanpa pertemuan berlaku untuk semua angkatan, sama seperti di
    // halaman Progres Peserta.
    prisma.assignment.findMany({
      where: { OR: [{ meetingId: null }, { meeting: { batchId } }] },
      select: { id: true, title: true, deadline: true },
      orderBy: { deadline: "asc" },
    }),
  ]);
  return { quizzes, assignments };
}

export async function loadBatchParticipantIds(batchId: string) {
  const rows = await prisma.participantProfile.findMany({
    where: { batchId, user: { status: "VERIFIED" } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function loadGradeSheet(batchId: string): Promise<GradeSheetData> {
  const [participants, { quizzes, assignments }] = await Promise.all([
    prisma.participantProfile.findMany({
      where: { batchId, user: { status: "VERIFIED" } },
      select: { id: true, studentId: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    loadGradeColumns(batchId),
  ]);

  const participantIds = participants.map((p) => p.id);
  const [attempts, submissions] = await Promise.all([
    quizzes.length && participantIds.length
      ? prisma.quizAttempt.findMany({
          where: {
            quizId: { in: quizzes.map((q) => q.id) },
            participantId: { in: participantIds },
          },
          select: { quizId: true, participantId: true, score: true, submittedAt: true },
        })
      : Promise.resolve([]),
    assignments.length && participantIds.length
      ? prisma.submission.findMany({
          where: {
            assignmentId: { in: assignments.map((a) => a.id) },
            participantId: { in: participantIds },
          },
          select: { assignmentId: true, participantId: true, score: true },
        })
      : Promise.resolve([]),
  ]);

  const columns: GradeColumn[] = [
    ...quizzes.map((quiz) => ({
      key: columnKey("quiz", quiz.id),
      kind: "quiz" as const,
      refId: quiz.id,
      title: quiz.title,
      dateLabel: formatDate(quiz.startAt),
    })),
    ...assignments.map((assignment) => ({
      key: columnKey("assignment", assignment.id),
      kind: "assignment" as const,
      refId: assignment.id,
      title: assignment.title,
      dateLabel: formatDate(assignment.deadline),
    })),
  ];

  const cellsByParticipant = new Map<string, Record<string, GradeCell>>();
  const cellsOf = (participantId: string) => {
    let cells = cellsByParticipant.get(participantId);
    if (!cells) {
      cells = {};
      cellsByParticipant.set(participantId, cells);
    }
    return cells;
  };

  for (const attempt of attempts) {
    cellsOf(attempt.participantId)[columnKey("quiz", attempt.quizId)] = attempt.submittedAt
      ? { score: attempt.score, state: "graded" }
      : { score: null, state: "in_progress" };
  }
  for (const submission of submissions) {
    cellsOf(submission.participantId)[columnKey("assignment", submission.assignmentId)] =
      submission.score === null
        ? { score: null, state: "submitted" }
        : { score: submission.score, state: "graded" };
  }

  return {
    batchId,
    columns,
    rows: participants.map((participant) => ({
      participantId: participant.id,
      name: participant.user.name,
      studentId: participant.studentId,
      cells: cellsByParticipant.get(participant.id) ?? {},
    })),
  };
}
