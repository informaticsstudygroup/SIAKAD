"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAttendanceToken } from "@/features/attendance/qr-token";
import { canManageBatch, getManagedBatchScope } from "@/lib/scope";

export type ScanResult = {
  ok: boolean;
  message: string;
  meetingTitle?: string;
  alreadyRecorded?: boolean;
};

const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";

/**
 * Inti pencatatan kehadiran. Berlapis-lapis sengaja: token sah saja tidak
 * cukup, peserta juga harus terdaftar di angkatan pertemuan itu dan sesinya
 * harus sedang dibuka mentor. Sengaja TIDAK memanggil revalidatePath, karena
 * fungsi ini juga dipakai dari server component saat render — dan Next.js
 * melarang revalidate saat render. Pembungkusnya di bawah yang merevalidasi.
 */
async function performCheckIn(token: string): Promise<ScanResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Kamu harus masuk dulu untuk mencatat kehadiran." };
  }
  if (session.user.role !== "PARTICIPANT") {
    return { ok: false, message: "Hanya peserta yang bisa melakukan presensi." };
  }

  const check = verifyAttendanceToken(token);
  if (!check.ok) {
    return {
      ok: false,
      message:
        check.reason === "EXPIRED"
          ? "Kode QR sudah kedaluwarsa. Pindai ulang kode terbaru di layar."
          : "Kode QR tidak dikenali. Pastikan memindai QR presensi ISG.",
    };
  }

  try {
    const participant = await prisma.participantProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, batchId: true },
    });
    if (!participant) {
      return { ok: false, message: "Profil peserta tidak ditemukan." };
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: check.meetingId },
      select: { id: true, title: true, batchId: true, attendanceOpen: true },
    });
    if (!meeting) {
      return { ok: false, message: "Pertemuan tidak ditemukan." };
    }
    if (!meeting.attendanceOpen) {
      return {
        ok: false,
        message: "Sesi presensi untuk pertemuan ini sedang ditutup.",
        meetingTitle: meeting.title,
      };
    }
    if (participant.batchId !== meeting.batchId) {
      return {
        ok: false,
        message: "Pertemuan ini bukan untuk angkatanmu.",
        meetingTitle: meeting.title,
      };
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        meetingId_participantId: {
          meetingId: meeting.id,
          participantId: participant.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        ok: true,
        alreadyRecorded: true,
        meetingTitle: meeting.title,
        message: "Kehadiranmu untuk pertemuan ini sudah tercatat sebelumnya.",
      };
    }

    await prisma.attendance.create({
      data: {
        meetingId: meeting.id,
        participantId: participant.id,
        status: "HADIR",
      },
    });

    return {
      ok: true,
      meetingTitle: meeting.title,
      message: "Kehadiranmu berhasil dicatat.",
    };
  } catch (error) {
    console.error("[presensi] gagal mencatat kehadiran:", error);
    return { ok: false, message: DB_DOWN };
  }
}

/** Dipakai pemindai kamera di klien; aman merevalidasi karena bukan saat render. */
export async function checkInWithToken(token: string): Promise<ScanResult> {
  const result = await performCheckIn(token);
  if (result.ok) {
    revalidatePath("/dashboard/presensi");
  }
  return result;
}

/**
 * Dipakai halaman /dashboard/presensi/scan yang menukar token saat render,
 * yaitu ketika QR dipindai memakai kamera bawaan HP.
 */
export async function checkInOnPageLoad(token: string): Promise<ScanResult> {
  return performCheckIn(token);
}

// ================= Koreksi manual oleh mentor =================

const manualSchema = z.object({
  meetingId: z.string().min(1),
  participantId: z.string().min(1),
  status: z.enum(AttendanceStatus),
  notes: z.string().trim().max(200).optional(),
});

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"];

/** Mentor menandai hadir/izin/tidak hadir secara manual, misal peserta lupa HP. */
export async function setAttendanceManually(
  input: z.infer<typeof manualSchema>,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) {
    return { error: "Kamu tidak memiliki akses untuk aksi ini." };
  }

  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    // Mentor hanya boleh mengoreksi presensi di angkatan yang dia kelola.
    const meeting = await prisma.meeting.findUnique({
      where: { id: parsed.data.meetingId },
      select: { batchId: true },
    });
    if (!meeting) return { error: "Pertemuan tidak ditemukan." };

    const scope = await getManagedBatchScope(session);
    if (!scope || !canManageBatch(scope, meeting.batchId)) {
      return { error: "Pertemuan itu bukan milik angkatan yang kamu kelola." };
    }

    await prisma.attendance.upsert({
      where: {
        meetingId_participantId: {
          meetingId: parsed.data.meetingId,
          participantId: parsed.data.participantId,
        },
      },
      create: {
        meetingId: parsed.data.meetingId,
        participantId: parsed.data.participantId,
        status: parsed.data.status,
        notes: parsed.data.notes || null,
      },
      update: {
        status: parsed.data.status,
        notes: parsed.data.notes || null,
      },
    });
  } catch (error) {
    console.error("[presensi] gagal menyimpan koreksi manual:", error);
    return { error: DB_DOWN };
  }

  revalidatePath(`/dashboard/jadwal/${parsed.data.meetingId}/presensi`);
  return {};
}
