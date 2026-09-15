import { prisma } from "@/lib/prisma";
import type { MonthlyAttendance } from "@/features/dashboard/participant/components/AttendanceBarChart";
import type { GradeTrendData } from "@/features/dashboard/participant/components/GradeTrendChart";
import type { ScheduleItem } from "@/features/dashboard/participant/components/UpcomingScheduleCard";
import type { ActivityItem } from "@/features/dashboard/participant/components/ActivityFeedCard";

/** Ambang kelulusan sertifikat. Satu tempat, dipakai dashboard dan halaman nilai. */
export const ATTENDANCE_TARGET = 80;
export const SCORE_TARGET = 70;

export type ParticipantDashboardData = {
  hasBatch: boolean;
  summary: {
    attendancePercent: number;
    tasksCompleted: number;
    tasksTotal: number;
    averageScore: number;
    certificatesEarned: number;
    activeQuizzes: number;
  };
  attendanceByMonth: MonthlyAttendance[];
  gradeTrend: GradeTrendData;
  upcoming: ScheduleItem[];
  activity: ActivityItem[];
  eligibility: {
    attendancePercent: number;
    attendanceTarget: number;
    taskScore: number;
    taskTarget: number;
    quizScore: number;
    quizTarget: number;
    eligible: boolean;
  };
};

const MONTH_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function emptyData(): ParticipantDashboardData {
  return {
    hasBatch: false,
    summary: {
      attendancePercent: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
      averageScore: 0,
      certificatesEarned: 0,
      activeQuizzes: 0,
    },
    attendanceByMonth: [],
    gradeTrend: { Semua: [], Tugas: [], Proyek: [], Kuis: [] },
    upcoming: [],
    activity: [],
    eligibility: {
      attendancePercent: 0,
      attendanceTarget: ATTENDANCE_TARGET,
      taskScore: 0,
      taskTarget: SCORE_TARGET,
      quizScore: 0,
      quizTarget: SCORE_TARGET,
      eligible: false,
    },
  };
}

/**
 * Semua angka di dashboard peserta dihitung dari data nyata. Kalau peserta
 * belum ditempatkan di angkatan, semuanya nol dan UI menampilkan keadaan itu
 * apa adanya, bukan angka contoh.
 */
export async function loadParticipantDashboard(
  userId: string,
): Promise<ParticipantDashboardData> {
  const profile = await prisma.participantProfile.findUnique({
    where: { userId },
    select: { id: true, batchId: true },
  });
  if (!profile) return emptyData();

  // Semua query ini dijalankan dalam satu gelombang. Menambah query ke dalam
  // Promise.all yang sama praktis gratis; menjalankannya terpisah menambah
  // satu perjalanan bolak-balik penuh ke server database.
  const [
    attendances,
    submissions,
    certificates,
    upcomingMeetings,
    quizzes,
    tasksTotal,
  ] = await Promise.all([
      prisma.attendance.findMany({
        where: { participantId: profile.id },
        select: {
          status: true,
          recordedAt: true,
          meeting: { select: { date: true, title: true } },
        },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.submission.findMany({
        where: { participantId: profile.id },
        select: {
          score: true,
          status: true,
          submittedAt: true,
          assignment: { select: { title: true, category: true } },
        },
        orderBy: { submittedAt: "asc" },
      }),
      prisma.certificate.count({
        where: { participantId: profile.id, status: "TERBIT" },
      }),
      profile.batchId
        ? prisma.meeting.findMany({
            where: { batchId: profile.batchId, date: { gte: new Date() } },
            select: { id: true, title: true, category: true, date: true, startTime: true },
            orderBy: { date: "asc" },
            take: 3,
          })
        : Promise.resolve([]),
      profile.batchId
        ? prisma.quiz.count({
            where: { batchId: profile.batchId, status: "ACTIVE" },
          })
        : Promise.resolve(0),
      profile.batchId
        ? prisma.assignment.count({
            where: {
              OR: [{ meetingId: null }, { meeting: { batchId: profile.batchId } }],
            },
          })
        : Promise.resolve(0),
    ]);

  // ----- Kehadiran -----
  const hadir = attendances.filter((a) => a.status === "HADIR").length;
  const attendancePercent = attendances.length
    ? Math.round((hadir / attendances.length) * 100)
    : 0;

  const byMonth = new Map<string, MonthlyAttendance>();
  for (const row of attendances) {
    const d = new Date(row.meeting.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const entry =
      byMonth.get(key) ??
      { month: MONTH_ID[d.getMonth()], hadir: 0, izin: 0, tidakHadir: 0 };
    if (row.status === "HADIR") entry.hadir += 1;
    else if (row.status === "IZIN") entry.izin += 1;
    else entry.tidakHadir += 1;
    byMonth.set(key, entry);
  }
  const attendanceByMonth = Array.from(byMonth.values()).slice(-6);

  // ----- Nilai tugas -----
  const graded = submissions.filter((s) => s.score !== null);
  const averageScore = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length)
    : 0;

  // Tren dipisah per kategori supaya peserta bisa melihat tugas dan proyek
  // secara terpisah, bukan hanya rata-rata gabungan.
  const pointsOf = (rows: typeof graded, prefix: string) =>
    rows.map((s, index) => ({
      label: `${prefix} ${index + 1}`,
      value: Math.round(s.score ?? 0),
    }));

  const gradeTrend: GradeTrendData = {
    Semua: pointsOf(graded, "Ke-"),
    Tugas: pointsOf(
      graded.filter((s) => s.assignment.category === "TUGAS"),
      "Tugas",
    ),
    Proyek: pointsOf(
      graded.filter((s) => s.assignment.category === "PROYEK"),
      "Proyek",
    ),
    Kuis: [],
  };

  // ----- Jadwal terdekat -----
  const upcoming: ScheduleItem[] = upcomingMeetings.map((meeting) => {
    const d = new Date(meeting.date);
    return {
      id: meeting.id,
      title: meeting.title,
      category: meeting.category,
      time: new Date(meeting.startTime).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      day: String(d.getDate()),
      month: MONTH_ID[d.getMonth()],
    };
  });

  // ----- Aktivitas terbaru: gabungan presensi dan tugas, terbaru dulu -----
  const activity: ActivityItem[] = [
    ...attendances.slice(-5).map((row, index) => ({
      id: `att-${index}`,
      title: `Presensi "${row.meeting.title}" tercatat`,
      date: new Date(row.recordedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: row.status,
      at: new Date(row.recordedAt).getTime(),
    })),
    ...submissions.slice(-5).map((row, index) => ({
      id: `sub-${index}`,
      title:
        row.status === "SUDAH_DINILAI"
          ? `Tugas "${row.assignment.title}" dinilai`
          : `Tugas "${row.assignment.title}" dikumpulkan`,
      date: new Date(row.submittedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: row.status === "SUDAH_DINILAI" ? "SUDAH_DINILAI" : "SELESAI",
      at: new Date(row.submittedAt).getTime(),
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map(({ at: _at, ...rest }) => rest) as ActivityItem[];

  const tasksCompleted = submissions.length;

  return {
    hasBatch: Boolean(profile.batchId),
    summary: {
      attendancePercent,
      tasksCompleted,
      tasksTotal,
      averageScore,
      certificatesEarned: certificates,
      activeQuizzes: quizzes,
    },
    attendanceByMonth,
    gradeTrend,
    upcoming,
    activity,
    eligibility: {
      attendancePercent,
      attendanceTarget: ATTENDANCE_TARGET,
      taskScore: averageScore,
      taskTarget: SCORE_TARGET,
      quizScore: 0,
      quizTarget: SCORE_TARGET,
      eligible: attendancePercent >= ATTENDANCE_TARGET && averageScore >= SCORE_TARGET,
    },
  };
}
