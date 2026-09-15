import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { AttendanceQrPanel } from "@/features/attendance/components/AttendanceQrPanel";
import { formatDateID } from "@/utils/format-date";
import { formatTimeRange } from "@/features/schedule/types";

export const metadata: Metadata = { title: "Sesi Presensi" };

export default async function SesiPresensiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requireRole(session, ["ADMIN", "MENTOR", "CO_MENTOR"]);

  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      attendanceOpen: true,
      batch: { select: { name: true, _count: { select: { participants: true } } } },
    },
  });

  if (!meeting) notFound();

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div>
        <Link
          href="/dashboard/jadwal"
          className="-ml-3 mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          Kembali ke Jadwal
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
          Sesi Presensi
        </h1>
        <p className="text-sm text-isg-muted">
          {meeting.batch.name} · {formatDateID(meeting.date)} ·{" "}
          {formatTimeRange(meeting.startTime, meeting.endTime)}
        </p>
      </div>

      <AttendanceQrPanel
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        initialOpen={meeting.attendanceOpen}
        totalParticipants={meeting.batch._count.participants}
      />
    </div>
  );
}
