"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MeetingCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageBatch, getManagedBatchScope } from "@/lib/scope";

export type MeetingFormState = { error?: string; success?: boolean };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"] as const;

async function assertStaff() {
  const session = await auth();
  if (!session?.user) return null;
  if (!STAFF.includes(session.user.role as (typeof STAFF)[number])) return null;
  return session;
}

const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";

async function guard<T>(label: string, run: () => Promise<T>) {
  try {
    return { data: await run() } as const;
  } catch (error) {
    console.error(`[jadwal] ${label} gagal:`, error);
    return { error: DB_DOWN } as const;
  }
}

/** Menggabungkan tanggal (YYYY-MM-DD) dan jam (HH:mm) jadi satu Date lokal. */
function combine(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

const meetingSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Judul pertemuan minimal 3 huruf."),
    category: z.enum(MeetingCategory),
    batchId: z.string().min(1, "Pilih angkatan."),
    date: z.string().min(1, "Tanggal wajib diisi."),
    startTime: z.string().min(1, "Jam mulai wajib diisi."),
    endTime: z.string().min(1, "Jam selesai wajib diisi."),
    location: z.string().trim().max(120).optional(),
    meetingLink: z.union([z.url("Tautan tidak valid."), z.literal("")]).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((d) => combine(d.date, d.endTime) > combine(d.date, d.startTime), {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["endTime"],
  });

export async function saveMeeting(
  _prevState: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = meetingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  // Mentor hanya boleh membuat/mengubah pertemuan di angkatannya sendiri.
  const scope = await getManagedBatchScope(session);
  if (!scope || !canManageBatch(scope, parsed.data.batchId)) {
    return { error: "Kamu tidak mengelola angkatan tersebut." };
  }

  const { id, date, startTime, endTime, location, meetingLink, description, ...rest } =
    parsed.data;

  const data = {
    ...rest,
    date: combine(date, startTime),
    startTime: combine(date, startTime),
    endTime: combine(date, endTime),
    location: location || null,
    meetingLink: meetingLink || null,
    description: description || null,
    mentorId: session.user.id,
  };

  if (id) {
    const existing = await guard("membaca pertemuan", () =>
      prisma.meeting.findUnique({ where: { id }, select: { batchId: true } }),
    );
    if ("error" in existing) return existing;
    if (!existing.data) return { error: "Pertemuan tidak ditemukan." };
    if (!canManageBatch(scope, existing.data.batchId)) {
      return { error: "Pertemuan itu bukan milik angkatan yang kamu kelola." };
    }
  }

  const result = await guard(id ? "mengubah pertemuan" : "membuat pertemuan", () =>
    id
      ? prisma.meeting.update({ where: { id }, data })
      : prisma.meeting.create({ data }),
  );

  if ("error" in result) return result;

  revalidatePath("/dashboard/jadwal");
  return { success: true };
}

export async function deleteMeeting(id: string): Promise<{ error?: string }> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const scope = await getManagedBatchScope(session);
  const target = await guard("membaca pertemuan", () =>
    prisma.meeting.findUnique({ where: { id }, select: { batchId: true } }),
  );
  if ("error" in target) return target;
  if (!target.data) return { error: "Pertemuan tidak ditemukan." };
  if (!scope || !canManageBatch(scope, target.data.batchId)) {
    return { error: "Pertemuan itu bukan milik angkatan yang kamu kelola." };
  }

  const result = await guard("menghapus pertemuan", () =>
    prisma.meeting.delete({ where: { id } }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/jadwal");
  return {};
}

/** Membuka atau menutup sesi presensi QR untuk satu pertemuan. */
export async function setAttendanceOpen(
  meetingId: string,
  open: boolean,
): Promise<{ error?: string }> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const scope = await getManagedBatchScope(session);
  const target = await guard("membaca pertemuan", () =>
    prisma.meeting.findUnique({ where: { id: meetingId }, select: { batchId: true } }),
  );
  if ("error" in target) return target;
  if (!target.data) return { error: "Pertemuan tidak ditemukan." };
  if (!scope || !canManageBatch(scope, target.data.batchId)) {
    return { error: "Pertemuan itu bukan milik angkatan yang kamu kelola." };
  }

  const result = await guard("mengubah sesi presensi", () =>
    prisma.meeting.update({
      where: { id: meetingId },
      data: {
        attendanceOpen: open,
        attendanceOpenedAt: open ? new Date() : null,
      },
    }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/jadwal");
  revalidatePath(`/dashboard/jadwal/${meetingId}/presensi`);
  return {};
}
