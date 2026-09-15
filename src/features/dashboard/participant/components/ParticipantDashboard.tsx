import { Info } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { AttendanceBarChart } from "@/features/dashboard/participant/components/AttendanceBarChart";
import { GradeTrendChart } from "@/features/dashboard/participant/components/GradeTrendChart";
import { CertificateEligibilityCard } from "@/features/dashboard/participant/components/CertificateEligibilityCard";
import { UpcomingScheduleCard } from "@/features/dashboard/participant/components/UpcomingScheduleCard";
import { ActivityFeedCard } from "@/features/dashboard/participant/components/ActivityFeedCard";
import type { ParticipantDashboardData } from "@/features/dashboard/participant/data";

export function ParticipantDashboard({
  name,
  data,
}: {
  name: string;
  data: ParticipantDashboardData;
}) {
  const firstName = name.split(" ")[0];
  const { summary } = data;
  const taskPercent = summary.tasksTotal
    ? Math.round((summary.tasksCompleted / summary.tasksTotal) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink sm:text-3xl">
          Selamat datang, {firstName}.
        </h1>
        <p className="text-sm text-isg-muted">
          Lihat perkembangan belajar dan aktivitas ISG kamu hari ini.
        </p>
      </div>

      {!data.hasBatch ? (
        <p className="flex items-start gap-2.5 rounded-card border border-isg-warn/30 bg-isg-warn/5 p-4 text-sm text-isg-ink-soft">
          <Info size={17} aria-hidden className="mt-0.5 shrink-0 text-isg-warn" />
          Kamu belum ditempatkan di angkatan mana pun, jadi jadwal dan presensi belum
          muncul. Hubungi Admin kalau ini terasa keliru.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Persentase Kehadiran"
          value={`${summary.attendancePercent}%`}
          badge={`${data.attendanceByMonth.length} bulan tercatat`}
          tone="hero"
        />
        <StatTile
          label="Tugas Dikumpulkan"
          value={`${summary.tasksCompleted}/${summary.tasksTotal}`}
          badge={`${taskPercent}%`}
          tone="blue"
        />
        <StatTile
          label="Rata-rata Nilai"
          value={summary.averageScore ? `${summary.averageScore}` : "—"}
          tone="mint"
        />
        <StatTile
          label="Sertifikat Diperoleh"
          value={`${summary.certificatesEarned}`}
          tone="cyan"
        />
        <StatTile label="Kuis Aktif" value={`${summary.activeQuizzes}`} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-card border border-isg-line bg-isg-surface p-5">
          <h3 className="mb-4 text-base font-extrabold text-isg-ink">
            Kehadiran per Bulan
          </h3>
          {data.attendanceByMonth.length ? (
            <AttendanceBarChart data={data.attendanceByMonth} />
          ) : (
            <Empty text="Belum ada presensi tercatat." />
          )}
        </div>
        <div className="rounded-card border border-isg-line bg-isg-surface p-5">
          <h3 className="mb-4 text-base font-extrabold text-isg-ink">Progress Nilai</h3>
          {data.gradeTrend.Semua.length ? (
            <GradeTrendChart data={data.gradeTrend} />
          ) : (
            <Empty text="Belum ada tugas yang dinilai." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CertificateEligibilityCard {...data.eligibility} />
        <UpcomingScheduleCard items={data.upcoming} />
        <ActivityFeedCard items={data.activity} />
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="flex h-40 items-center justify-center text-center text-sm text-isg-muted">
      {text}
    </p>
  );
}
