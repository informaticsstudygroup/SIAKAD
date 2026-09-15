import { prisma } from "@/lib/prisma";
import {
  ATTENDANCE_TARGET,
  SCORE_TARGET,
} from "@/features/dashboard/participant/data";

export type BatchOverview = {
  id: string;
  name: string;
  period: string;
  isActive: boolean;
  capacity: number;
  mentorName: string | null;
  coMentorName: string | null;
  participantCount: number;
  meetingCount: number;
  quizCount: number;
};

export type ParticipantProgress = {
  id: string;
  name: string;
  studentId: string;
  photoUrl: string | null;
  batchName: string | null;
  attendancePercent: number;
  attendanceCount: number;
  totalMeetings: number;
  tasksSubmitted: number;
  totalTasks: number;
  taskAverage: number | null;
  quizzesTaken: number;
  totalQuizzes: number;
  quizAverage: number | null;
  eligible: boolean;
};

export type MonitoringOverview = {
  totals: {
    activeBatches: number;
    mentors: number;
    coMentors: number;
    participants: number;
    pendingApplicants: number;
  };
  batches: BatchOverview[];
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/** Ringkasan untuk halaman pemantauan Advisor. Tidak mengubah apa pun. */
export async function loadMonitoringOverview(): Promise<MonitoringOverview> {
  const [batches, mentors, coMentors, participants, pending] = await Promise.all([
    prisma.batch.findMany({
      include: {
        mentor: { select: { name: true } },
        coMentor: { select: { name: true } },
        _count: { select: { participants: true, meetings: true, quizzes: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.count({ where: { role: "MENTOR", status: "VERIFIED" } }),
    prisma.user.count({ where: { role: "CO_MENTOR", status: "VERIFIED" } }),
    prisma.user.count({ where: { role: "PARTICIPANT", status: "VERIFIED" } }),
    prisma.user.count({ where: { role: "PARTICIPANT", status: "PENDING" } }),
  ]);

  return {
    totals: {
      activeBatches: batches.filter((b) => b.isActive).length,
      mentors,
      coMentors,
      participants,
      pendingApplicants: pending,
    },
    batches: batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      period: batch.period,
      isActive: batch.isActive,
      capacity: batch.capacity,
      mentorName: batch.mentor?.name ?? null,
      coMentorName: batch.coMentor?.name ?? null,
      participantCount: batch._count.participants,
      meetingCount: batch._count.meetings,
      quizCount: batch._count.quizzes,
    })),
  };
}

export type ParticipantProgressFilter = {
  batchId?: string;
  batchIds?: string[];
};

/**
 * Progres tiap peserta. Dihitung akurat terhadap total kegiatan di angkatannya.
 * Mendukung filter batchId tunggal maupun batchIds (untuk wewenang mentor).
 */
export async function loadParticipantProgress(
  filter?: string | ParticipantProgressFilter,
): Promise<ParticipantProgress[]> {
  const options: ParticipantProgressFilter =
    typeof filter === "string" ? { batchId: filter } : (filter ?? {});

  if (options.batchIds && options.batchIds.length === 0) {
    return [];
  }

  const batchWhereClause = options.batchId
    ? { batchId: options.batchId }
    : options.batchIds
      ? { batchId: { in: options.batchIds } }
      : {};

  const rows = await prisma.participantProfile.findMany({
    where: {
      user: { status: "VERIFIED" },
      ...batchWhereClause,
    },
    select: {
      id: true,
      batchId: true,
      studentId: true,
      user: { select: { name: true, photoUrl: true } },
      batch: { select: { name: true } },
      attendances: { select: { status: true } },
      submissions: { select: { score: true } },
      quizAttempts: {
        where: { submittedAt: { not: null } },
        select: { score: true },
      },
    },
    orderBy: { registeredAt: "asc" },
  });

  const distinctBatchIds = Array.from(
    new Set(rows.map((r) => r.batchId).filter((id): id is string => Boolean(id))),
  );

  const now = new Date();

  // Hitung total pertemuan yang sudah lewat / presensi dibuka, total tugas, dan total kuis per angkatan
  const [meetings, assignments, quizzes] = await Promise.all([
    distinctBatchIds.length > 0
      ? prisma.meeting.findMany({
          where: {
            batchId: { in: distinctBatchIds },
            OR: [{ date: { lte: now } }, { attendanceOpen: true }],
          },
          select: { batchId: true },
        })
      : Promise.resolve([]),
    distinctBatchIds.length > 0
      ? prisma.assignment.findMany({
          where: {
            OR: [
              { meetingId: null },
              { meeting: { batchId: { in: distinctBatchIds } } },
            ],
          },
          select: { meeting: { select: { batchId: true } } },
        })
      : Promise.resolve([]),
    distinctBatchIds.length > 0
      ? prisma.quiz.findMany({
          where: {
            batchId: { in: distinctBatchIds },
            status: { not: "DRAFT" },
          },
          select: { batchId: true },
        })
      : Promise.resolve([]),
  ]);

  const meetingCountByBatch = new Map<string, number>();
  for (const m of meetings) {
    meetingCountByBatch.set(m.batchId, (meetingCountByBatch.get(m.batchId) ?? 0) + 1);
  }

  const generalAssignmentCount = assignments.filter((a) => !a.meeting?.batchId).length;
  const assignmentCountByBatch = new Map<string, number>();
  for (const a of assignments) {
    if (a.meeting?.batchId) {
      assignmentCountByBatch.set(
        a.meeting.batchId,
        (assignmentCountByBatch.get(a.meeting.batchId) ?? 0) + 1,
      );
    }
  }

  const quizCountByBatch = new Map<string, number>();
  for (const q of quizzes) {
    quizCountByBatch.set(q.batchId, (quizCountByBatch.get(q.batchId) ?? 0) + 1);
  }

  return rows.map((row) => {
    const totalMeetings = row.batchId ? (meetingCountByBatch.get(row.batchId) ?? 0) : 0;
    const totalTasks = row.batchId
      ? generalAssignmentCount + (assignmentCountByBatch.get(row.batchId) ?? 0)
      : 0;
    const totalQuizzes = row.batchId ? (quizCountByBatch.get(row.batchId) ?? 0) : 0;

    const hadir = row.attendances.filter((a) => a.status === "HADIR").length;

    // Kehadiran dihitung terhadap pertemuan yang telah dilaksanakan
    const attendancePercent =
      totalMeetings > 0
        ? Math.round((hadir / totalMeetings) * 100)
        : row.attendances.length > 0
          ? Math.round((hadir / row.attendances.length) * 100)
          : 0;

    const taskScores = row.submissions
      .map((s) => s.score)
      .filter((v): v is number => v !== null);
    const quizScores = row.quizAttempts
      .map((a) => a.score)
      .filter((v): v is number => v !== null);

    const taskAverage = average(taskScores);
    const quizAverage = average(quizScores);

    const isAttendanceEligible =
      totalMeetings === 0 || attendancePercent >= ATTENDANCE_TARGET;

    return {
      id: row.id,
      name: row.user.name,
      studentId: row.studentId,
      photoUrl: row.user.photoUrl,
      batchName: row.batch?.name ?? null,
      attendancePercent,
      attendanceCount: hadir,
      totalMeetings,
      tasksSubmitted: row.submissions.length,
      totalTasks,
      taskAverage,
      quizzesTaken: row.quizAttempts.length,
      totalQuizzes,
      quizAverage,
      eligible: isAttendanceEligible && (taskAverage ?? 0) >= SCORE_TARGET,
    };
  });
}
