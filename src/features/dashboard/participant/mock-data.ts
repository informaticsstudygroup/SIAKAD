// Data contoh — akan diganti query Prisma nyata setelah fitur Jadwal,
// Presensi, Tugas, Kuis, dan Sertifikat dibangun.

import type { MonthlyAttendance } from "@/features/dashboard/participant/components/AttendanceBarChart";
import type { GradeTrendData } from "@/features/dashboard/participant/components/GradeTrendChart";
import type { ScheduleItem } from "@/features/dashboard/participant/components/UpcomingScheduleCard";
import type { ActivityItem } from "@/features/dashboard/participant/components/ActivityFeedCard";

export const mockAttendanceByMonth: MonthlyAttendance[] = [
  { month: "Mar", hadir: 3, izin: 1, tidakHadir: 0 },
  { month: "Apr", hadir: 4, izin: 0, tidakHadir: 1 },
  { month: "Mei", hadir: 3, izin: 1, tidakHadir: 1 },
  { month: "Jun", hadir: 4, izin: 0, tidakHadir: 0 },
  { month: "Jul", hadir: 4, izin: 1, tidakHadir: 0 },
  { month: "Agu", hadir: 3, izin: 0, tidakHadir: 0 },
];

export const mockGradeTrend: GradeTrendData = {
  Semua: [
    { label: "Mgg 1", value: 78 },
    { label: "Mgg 2", value: 82 },
    { label: "Mgg 3", value: 80 },
    { label: "Mgg 4", value: 88 },
    { label: "Mgg 5", value: 85 },
    { label: "Mgg 6", value: 91 },
  ],
  Tugas: [
    { label: "Mgg 1", value: 80 },
    { label: "Mgg 2", value: 84 },
    { label: "Mgg 3", value: 79 },
    { label: "Mgg 4", value: 90 },
    { label: "Mgg 5", value: 87 },
    { label: "Mgg 6", value: 92 },
  ],
  Kuis: [
    { label: "Mgg 2", value: 75 },
    { label: "Mgg 4", value: 83 },
    { label: "Mgg 6", value: 89 },
  ],
  Proyek: [
    { label: "Mgg 3", value: 80 },
    { label: "Mgg 6", value: 90 },
  ],
};

export const mockUpcomingSchedule: ScheduleItem[] = [
  { id: "1", title: "Kelas: Pengenalan React", category: "Kelas", time: "19.00 WIB", day: "12", month: "Agu" },
  { id: "2", title: "Workshop Git & GitHub", category: "Workshop", time: "13.00 WIB", day: "15", month: "Agu" },
  { id: "3", title: "Sharing Session: Karier IT", category: "Sharing", time: "19.30 WIB", day: "20", month: "Agu" },
];

export const mockActivity: ActivityItem[] = [
  { id: "1", title: "Tugas “Komponen React” dinilai", date: "8 Agu 2026", status: "SUDAH_DINILAI" },
  { id: "2", title: "Kuis “Dasar Git” aktif", date: "7 Agu 2026", status: "AKTIF" },
  { id: "3", title: "Presensi Kelas #6 tercatat", date: "5 Agu 2026", status: "HADIR" },
  { id: "4", title: "Pengumuman: Libur pertemuan minggu depan", date: "3 Agu 2026", status: "SELESAI" },
];

export const mockSummary = {
  attendancePercent: 92,
  tasksCompleted: 8,
  tasksTotal: 10,
  averageScore: 87,
  certificatesEarned: 1,
  activeQuizzes: 1,
};

export const mockCertificateEligibility = {
  attendancePercent: 92,
  attendanceTarget: 80,
  taskScore: 87,
  taskTarget: 70,
  quizScore: 85,
  quizTarget: 70,
  eligible: true,
};
