import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { QrScanner } from "@/features/attendance/components/QrScanner";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateID } from "@/utils/format-date";
import { MEETING_CATEGORY_LABEL } from "@/features/schedule/types";

export const metadata: Metadata = { title: "Presensi" };

export default async function PresensiPage() {
  const session = await auth();
  const user = requireRole(session, ["PARTICIPANT"]);

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, batchId: true },
  });

  const [openMeetings, history] = await Promise.all([
    profile?.batchId
      ? prisma.meeting.findMany({
          where: { batchId: profile.batchId, attendanceOpen: true },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    profile
      ? prisma.attendance.findMany({
          where: { participantId: profile.id },
          select: {
            id: true,
            status: true,
            recordedAt: true,
            meeting: { select: { title: true, date: true, category: true } },
          },
          orderBy: { recordedAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  const hadir = history.filter((row) => row.status === "HADIR").length;
  const persen = history.length ? Math.round((hadir / history.length) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Presensi</h1>
        <p className="text-sm text-isg-muted">
          Pindai kode QR yang ditampilkan mentor untuk mencatat kehadiranmu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {openMeetings.length > 0 ? (
            <div className="flex items-center gap-2.5 rounded-card border border-isg-ok/30 bg-isg-ok/5 px-4 py-3">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full bg-isg-ok motion-safe:animate-pulse"
              />
              <p className="text-sm font-semibold text-isg-ok">
                Presensi dibuka: {openMeetings.map((m) => m.title).join(", ")}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-card border border-isg-line bg-isg-surface px-4 py-3">
              <QrCode size={16} aria-hidden className="shrink-0 text-isg-muted" />
              <p className="text-sm text-isg-muted">
                Belum ada sesi presensi yang dibuka saat ini.
              </p>
            </div>
          )}

          <QrScanner />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-card border border-isg-line bg-isg-surface p-5">
            <div>
              <p className="text-sm font-bold text-isg-ink">Rekap Kehadiran</p>
              <p className="text-sm text-isg-muted">
                {hadir} hadir dari {history.length} pertemuan tercatat
              </p>
            </div>
            <span className="text-3xl font-extrabold tabular-nums text-isg-ink">
              {persen}%
            </span>
          </div>

          <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
            {history.length === 0 ? (
              <p className="p-10 text-center text-sm text-isg-muted">
                Belum ada riwayat presensi.
              </p>
            ) : (
              <ul className="divide-y divide-isg-line">
                {history.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-isg-ink">
                        {row.meeting.title}
                      </p>
                      <p className="text-xs text-isg-muted">
                        {MEETING_CATEGORY_LABEL[row.meeting.category]} ·{" "}
                        {formatDateID(row.meeting.date)}
                      </p>
                    </div>
                    <StatusChip status={row.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
