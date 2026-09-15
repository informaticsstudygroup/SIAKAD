import { prisma } from "@/lib/prisma";

export type MentorDashboardData = {
  batches: {
    id: string;
    name: string;
    period: string;
    participantCount: number;
    capacity: number;
    role: "Mentor" | "Co-Mentor";
  }[];
  totals: {
    participants: number;
    upcomingMeetings: number;
    pendingGrading: number;
    activeQuizzes: number;
  };
  upcoming: {
    id: string;
    title: string;
    batchName: string;
    date: Date;
    startTime: Date;
    attendanceOpen: boolean;
  }[];
  needsGrading: {
    id: string;
    assignmentTitle: string;
    participantName: string;
    submittedAt: Date;
  }[];
};

/**
 * Ringkasan untuk mentor dan co-mentor: apa yang perlu dikerjakan hari ini.
 * Hanya membaca angkatan tempat dia benar-benar ditugaskan.
 */
export async function loadMentorDashboard(
  userId: string,
): Promise<MentorDashboardData> {
  const batches = await prisma.batch.findMany({
    where: { OR: [{ mentorId: userId }, { coMentorId: userId }] },
    select: {
      id: true,
      name: true,
      period: true,
      capacity: true,
      mentorId: true,
      _count: { select: { participants: true } },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const batchIds = batches.map((b) => b.id);

  // Tanpa angkatan, tidak ada yang perlu ditampilkan — dan query di bawah
  // akan sia-sia, jadi langsung dikembalikan kosong.
  if (batchIds.length === 0) {
    return {
      batches: [],
      totals: {
        participants: 0,
        upcomingMeetings: 0,
        pendingGrading: 0,
        activeQuizzes: 0,
      },
      upcoming: [],
      needsGrading: [],
    };
  }

  const [upcomingMeetings, ungraded, activeQuizzes] = await Promise.all([
    prisma.meeting.findMany({
      where: { batchId: { in: batchIds }, date: { gte: new Date() } },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        attendanceOpen: true,
        batch: { select: { name: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.submission.findMany({
      where: {
        score: null,
        OR: [
          { assignment: { meetingId: null } },
          { assignment: { meeting: { batchId: { in: batchIds } } } },
        ],
      },
      select: {
        id: true,
        submittedAt: true,
        assignment: { select: { title: true } },
        participant: { select: { user: { select: { name: true } } } },
      },
      orderBy: { submittedAt: "asc" },
      take: 8,
    }),
    prisma.quiz.count({
      where: { batchId: { in: batchIds }, status: "ACTIVE" },
    }),
  ]);

  return {
    batches: batches.map((b) => ({
      id: b.id,
      name: b.name,
      period: b.period,
      participantCount: b._count.participants,
      capacity: b.capacity,
      role: b.mentorId === userId ? "Mentor" : "Co-Mentor",
    })),
    totals: {
      participants: batches.reduce((sum, b) => sum + b._count.participants, 0),
      upcomingMeetings: upcomingMeetings.length,
      pendingGrading: ungraded.length,
      activeQuizzes,
    },
    upcoming: upcomingMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      batchName: m.batch.name,
      date: m.date,
      startTime: m.startTime,
      attendanceOpen: m.attendanceOpen,
    })),
    needsGrading: ungraded.map((s) => ({
      id: s.id,
      assignmentTitle: s.assignment.title,
      participantName: s.participant.user.name,
      submittedAt: s.submittedAt,
    })),
  };
}
