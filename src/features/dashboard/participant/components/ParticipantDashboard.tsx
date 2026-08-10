import { StatTile } from "@/components/ui/StatTile";
import { AttendanceBarChart } from "@/features/dashboard/participant/components/AttendanceBarChart";
import { GradeTrendChart } from "@/features/dashboard/participant/components/GradeTrendChart";
import { CertificateEligibilityCard } from "@/features/dashboard/participant/components/CertificateEligibilityCard";
import { UpcomingScheduleCard } from "@/features/dashboard/participant/components/UpcomingScheduleCard";
import { ActivityFeedCard } from "@/features/dashboard/participant/components/ActivityFeedCard";
import {
  mockActivity,
  mockAttendanceByMonth,
  mockCertificateEligibility,
  mockGradeTrend,
  mockSummary,
  mockUpcomingSchedule,
} from "@/features/dashboard/participant/mock-data";

export function ParticipantDashboard({ name }: { name: string }) {
  const firstName = name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#102033] sm:text-3xl">
          Selamat datang, {firstName}.
        </h1>
        <p className="text-sm text-[#64748B]">
          Lihat perkembangan belajar dan aktivitas ISG kamu hari ini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Persentase Kehadiran"
          value={`${mockSummary.attendancePercent}%`}
          badge="6 bulan terakhir"
          tone="hero"
        />
        <StatTile
          label="Tugas Selesai"
          value={`${mockSummary.tasksCompleted}/${mockSummary.tasksTotal}`}
          badge="80%"
          tone="blue"
        />
        <StatTile label="Rata-rata Nilai" value={`${mockSummary.averageScore}`} badge="Naik 4" tone="mint" />
        <StatTile
          label="Sertifikat Diperoleh"
          value={`${mockSummary.certificatesEarned}`}
          tone="cyan"
        />
        <StatTile
          label="Kuis Aktif"
          value={`${mockSummary.activeQuizzes}`}
          badge="Segera berakhir"
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <h3 className="mb-4 text-base font-semibold text-[#102033]">Kehadiran per Bulan</h3>
          <AttendanceBarChart data={mockAttendanceByMonth} />
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <h3 className="mb-4 text-base font-semibold text-[#102033]">Progress Nilai</h3>
          <GradeTrendChart data={mockGradeTrend} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CertificateEligibilityCard {...mockCertificateEligibility} />
        <UpcomingScheduleCard items={mockUpcomingSchedule} />
        <ActivityFeedCard items={mockActivity} />
      </div>
    </div>
  );
}
