"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssignmentCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AssignmentFormState = { error?: string; success?: boolean };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"];

const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";

async function assertStaff() {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) return null;
  return session;
}

async function guard<T>(label: string, run: () => Promise<T>) {
  try {
    return { data: await run() } as const;
  } catch (error) {
    console.error(`[tugas] ${label} gagal:`, error);
    return { error: DB_DOWN } as const;
  }
}

// ================= Staf: kelola tugas =================

const assignmentSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Judul tugas minimal 3 huruf."),
  category: z.enum(AssignmentCategory),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter."),
  meetingId: z.string().optional(),
  deadlineDate: z.string().min(1, "Tanggal batas wajib diisi."),
  deadlineTime: z.string().min(1, "Jam batas wajib diisi."),
  attachmentUrl: z.union([z.url("Tautan tidak valid."), z.literal("")]).optional(),
});

export async function saveAssignment(
  _prevState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { id, deadlineDate, deadlineTime, meetingId, attachmentUrl, ...rest } =
    parsed.data;

  const data = {
    ...rest,
    deadline: new Date(`${deadlineDate}T${deadlineTime}:00`),
    meetingId: meetingId || null,
    attachmentUrl: attachmentUrl || null,
    mentorId: session.user.id,
  };

  const result = await guard(id ? "mengubah tugas" : "membuat tugas", () =>
    id
      ? prisma.assignment.update({ where: { id }, data })
      : prisma.assignment.create({ data }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/tugas");
  return { success: true };
}

export async function deleteAssignment(id: string): Promise<{ error?: string }> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const result = await guard("menghapus tugas", () =>
    prisma.assignment.delete({ where: { id } }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/tugas");
  return {};
}

// ================= Peserta: kumpulkan tugas =================

const submitSchema = z.object({
  assignmentId: z.string().min(1),
  fileUrl: z.url("Masukkan tautan yang valid, contoh tautan Google Drive."),
});

export async function submitAssignment(
  _prevState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const session = await auth();
  if (session?.user.role !== "PARTICIPANT") {
    return { error: "Hanya peserta yang bisa mengumpulkan tugas." };
  }

  const parsed = submitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const participant = await prisma.participantProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!participant) return { error: "Profil peserta tidak ditemukan." };

    const assignment = await prisma.assignment.findUnique({
      where: { id: parsed.data.assignmentId },
      select: { id: true, deadline: true },
    });
    if (!assignment) return { error: "Tugas tidak ditemukan." };

    // Terlambat tetap diterima, tapi ditandai — mentor yang memutuskan.
    const status = new Date() > assignment.deadline ? "TERLAMBAT" : "SUDAH_DIKUMPULKAN";

    await prisma.submission.upsert({
      where: {
        assignmentId_participantId: {
          assignmentId: assignment.id,
          participantId: participant.id,
        },
      },
      create: {
        assignmentId: assignment.id,
        participantId: participant.id,
        fileUrl: parsed.data.fileUrl,
        status,
      },
      update: {
        fileUrl: parsed.data.fileUrl,
        status,
        // Pengumpulan ulang membatalkan penilaian sebelumnya.
        score: null,
        feedback: null,
        gradedById: null,
        gradedAt: null,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[tugas] gagal mengumpulkan:", error);
    return { error: DB_DOWN };
  }

  revalidatePath("/dashboard/tugas");
  revalidatePath(`/dashboard/tugas/${parsed.data.assignmentId}`);
  return { success: true };
}

// ================= Staf: nilai pengumpulan =================

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.coerce.number().min(0, "Nilai minimal 0.").max(100, "Nilai maksimal 100."),
  feedback: z.string().trim().max(1000).optional(),
});

export async function gradeSubmission(
  _prevState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = gradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const result = await guard("menyimpan nilai", () =>
    prisma.submission.update({
      where: { id: parsed.data.submissionId },
      data: {
        score: parsed.data.score,
        feedback: parsed.data.feedback || null,
        status: "SUDAH_DINILAI",
        gradedById: session.user.id,
        gradedAt: new Date(),
      },
      select: { assignmentId: true },
    }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/tugas");
  revalidatePath(`/dashboard/tugas/${result.data.assignmentId}`);
  return { success: true };
}
