import Link from "next/link";
import { CalendarDays, FileText, QrCode, Users } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import type { MentorDashboardData } from "@/features/dashboard/mentor/data";
import { formatDateID } from "@/utils/format-date";
import { formatTimeRange } from "@/features/schedule/types";
import { cn } from "@/utils/cn";

export function MentorDashboard({
  name,
  data,
}: {
  name: string;
  data: MentorDashboardData;
}) {
  const { totals } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink sm:text-3xl">
          Selamat datang, {name.split(" ")[0]}.
        </h1>
        <p className="text-sm text-isg-muted">
          Ringkasan angkatan yang kamu dampingi.
        </p>
      </div>

      {data.batches.length === 0 ? (
        <p className="rounded-card border border-isg-warn/30 bg-isg-warn/5 p-4 text-sm text-isg-ink-soft">
          Kamu belum ditugaskan ke angkatan mana pun. Admin bisa menugaskanmu lewat
          halaman Angkatan.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href="/dashboard/pantau"
          className="flex transition-transform hover:-translate-y-0.5"
          title="Lihat progres semua peserta binaan"
        >
          <StatTile label="Peserta Dampingan" value={`${totals.participants}`} tone="hero" />
        </Link>
        <StatTile
          label="Pertemuan Mendatang"
          value={`${totals.upcomingMeetings}`}
          tone="blue"
        />
        <StatTile
          label="Menunggu Dinilai"
          value={`${totals.pendingGrading}`}
          tone="mint"
        />
        <StatTile label="Kuis Aktif" value={`${totals.activeQuizzes}`} tone="cyan" />
      </div>

      {data.batches.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.batches.map((batch) => (
            <li
              key={batch.id}
              className="flex flex-col justify-between gap-3 rounded-card border border-isg-line bg-isg-surface p-5"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate font-extrabold text-isg-ink">{batch.name}</h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                      batch.role === "Mentor"
                        ? "bg-isg-blue/10 text-isg-blue"
                        : "bg-isg-mint/20 text-isg-ok",
                    )}
                  >
                    {batch.role}
                  </span>
                </div>
                <p className="text-sm text-isg-muted">{batch.period}</p>
                <p className="flex items-center gap-1.5 text-sm text-isg-ink-soft">
                  <Users size={14} aria-hidden />
                  {batch.participantCount}/{batch.capacity} peserta
                </p>
              </div>
              <div className="border-t border-isg-line pt-3">
                <Link
                  href={`/dashboard/pantau?batch=${batch.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-isg-blue hover:underline"
                >
                  Lihat Progres Mahasiswa →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-isg-ink">
              <CalendarDays size={17} aria-hidden />
              Pertemuan Mendatang
            </h2>
            <Link
              href="/dashboard/jadwal"
              className="text-sm font-bold text-isg-blue hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {data.upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-isg-muted">
              Tidak ada pertemuan terjadwal.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.upcoming.map((meeting) => (
                <li
                  key={meeting.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-isg-tint p-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-isg-ink">
                      {meeting.title}
                    </p>
                    <p className="text-xs text-isg-muted">
                      {meeting.batchName} · {formatDateID(meeting.date)} ·{" "}
                      {formatTimeRange(meeting.startTime, meeting.startTime)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/jadwal/${meeting.id}/presensi`}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                      meeting.attendanceOpen
                        ? "bg-isg-ok text-white"
                        : "bg-isg-ink text-white hover:bg-isg-navy",
                    )}
                  >
                    <QrCode size={13} aria-hidden />
                    {meeting.attendanceOpen ? "Dibuka" : "Presensi"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-isg-ink">
              <FileText size={17} aria-hidden />
              Menunggu Dinilai
            </h2>
            <Link
              href="/dashboard/tugas"
              className="text-sm font-bold text-isg-blue hover:underline"
            >
              Ke Tugas
            </Link>
          </div>

          {data.needsGrading.length === 0 ? (
            <p className="py-8 text-center text-sm text-isg-muted">
              Semua pengumpulan sudah dinilai.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.needsGrading.map((row) => (
                <li key={row.id} className="rounded-xl bg-isg-tint p-3.5">
                  <p className="truncate text-sm font-bold text-isg-ink">
                    {row.assignmentTitle}
                  </p>
                  <p className="text-xs text-isg-muted">
                    {row.participantName} · dikumpulkan {formatDateID(row.submittedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
