import Link from "next/link";
import { ArrowRight, Eye, GraduationCap, UserCheck, Users } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import type { MonitoringOverview as Overview } from "@/features/monitoring/data";
import { cn } from "@/utils/cn";

export function MonitoringOverview({
  data,
  viewerName,
}: {
  data: Overview;
  viewerName: string;
}) {
  const { totals } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink sm:text-3xl">
          Selamat datang, {viewerName.split(" ")[0]}.
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-isg-muted">
          <Eye size={14} aria-hidden />
          Panel pemantauan. Kamu bisa melihat seluruh data, tanpa mengubahnya.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Angkatan Aktif"
          value={`${totals.activeBatches}`}
          badge={`${data.batches.length} total`}
          tone="hero"
        />
        <StatTile label="Peserta Aktif" value={`${totals.participants}`} tone="blue" />
        <StatTile label="Mentor" value={`${totals.mentors}`} tone="mint" />
        <StatTile label="Co-Mentor" value={`${totals.coMentors}`} tone="cyan" />
        <StatTile
          label="Menunggu Verifikasi"
          value={`${totals.pendingApplicants}`}
          tone="neutral"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-extrabold text-isg-ink">Angkatan</h2>
        <Link
          href="/dashboard/pantau"
          className="flex items-center gap-1.5 rounded-full bg-isg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-navy"
        >
          Lihat Progres Peserta
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {data.batches.length === 0 ? (
        <p className="rounded-card border border-dashed border-isg-line bg-isg-surface p-12 text-center text-sm text-isg-muted">
          Belum ada angkatan yang dibuat Admin.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.batches.map((batch) => (
            <li
              key={batch.id}
              className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold tracking-tight text-isg-ink">
                    {batch.name}
                  </h3>
                  <p className="text-sm text-isg-muted">{batch.period}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                    batch.isActive
                      ? "bg-isg-ok/10 text-isg-ok"
                      : "bg-isg-tint text-isg-muted",
                  )}
                >
                  {batch.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Row icon={<UserCheck size={14} />} label="Mentor">
                  {batch.mentorName ?? "Belum ditentukan"}
                </Row>
                <Row icon={<UserCheck size={14} />} label="Co-Mentor">
                  {batch.coMentorName ?? "Belum ditentukan"}
                </Row>
              </dl>

              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-isg-line pt-4 text-sm">
                <Metric
                  icon={<Users size={14} />}
                  label="Peserta"
                  value={`${batch.participantCount}/${batch.capacity}`}
                />
                <Metric
                  icon={<GraduationCap size={14} />}
                  label="Pertemuan"
                  value={`${batch.meetingCount}`}
                />
                <Metric label="Kuis" value={`${batch.quizCount}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-isg-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="truncate font-bold text-isg-ink">{children}</dd>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-isg-muted">
      {icon ? <span aria-hidden>{icon}</span> : null}
      {label}
      <strong className="font-extrabold tabular-nums text-isg-ink">{value}</strong>
    </span>
  );
}
