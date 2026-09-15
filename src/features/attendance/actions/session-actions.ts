"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAttendanceToken,
  secondsUntilRotate,
} from "@/features/attendance/qr-token";

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"];

export type RosterEntry = {
  participantId: string;
  name: string;
  studentId: string;
  status: "HADIR" | "IZIN" | "TIDAK_HADIR" | null;
  at: string | null;
};

export type AttendanceSnapshot = {
  error?: string;
  token?: string;
  secondsLeft?: number;
  open?: boolean;
  /** Seluruh peserta angkatan, termasuk yang belum tercatat sama sekali. */
  roster?: RosterEntry[];
};

/**
 * Satu panggilan mengembalikan token QR terbaru sekaligus daftar yang sudah
 * memindai, supaya panel mentor cukup melakukan satu round-trip per rotasi.
 */
export async function getAttendanceSnapshot(
  meetingId: string,
): Promise<AttendanceSnapshot> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) {
    return { error: "Kamu tidak memiliki akses." };
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, batchId: true, attendanceOpen: true },
    });
    if (!meeting) return { error: "Pertemuan tidak ditemukan." };

    // Seluruh peserta angkatan diambil, bukan hanya yang sudah memindai —
    // mentor perlu melihat siapa yang belum hadir untuk menandainya manual.
    const [participants, records] = await Promise.all([
      prisma.participantProfile.findMany({
        where: { batchId: meeting.batchId, user: { status: "VERIFIED" } },
        select: { id: true, studentId: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.attendance.findMany({
        where: { meetingId },
        select: { participantId: true, status: true, recordedAt: true },
      }),
    ]);

    const byParticipant = new Map(records.map((r) => [r.participantId, r]));

    return {
      open: meeting.attendanceOpen,
      token: meeting.attendanceOpen ? createAttendanceToken(meetingId) : undefined,
      secondsLeft: secondsUntilRotate(),
      roster: participants.map((p) => {
        const record = byParticipant.get(p.id);
        return {
          participantId: p.id,
          name: p.user.name,
          studentId: p.studentId,
          status: record?.status ?? null,
          at: record?.recordedAt.toISOString() ?? null,
        };
      }),
    };
  } catch (error) {
    console.error("[presensi] gagal mengambil snapshot sesi:", error);
    return { error: "Server sedang tidak bisa menghubungi database." };
  }
}
