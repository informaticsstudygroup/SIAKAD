"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/transporter";
import {
  buildVerificationSuccessEmail,
  buildApplicantRejectionEmail,
  buildApplicantRevisionEmail,
} from "@/lib/email/templates/verification-email";

export type VerificationFormState = { error?: string; success?: boolean };

function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function assertAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return null;
  return session;
}

const verifySchema = z.object({
  participantId: z.string().min(1),
  batchId: z.string().min(1, "Pilih angkatan untuk peserta ini."),
  note: z.string().optional(),
});

export async function verifyApplicant(
  _prevState: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = verifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const [participant, batch] = await Promise.all([
    prisma.participantProfile.findUnique({
      where: { id: parsed.data.participantId },
      include: { user: true },
    }),
    prisma.batch.findUnique({
      where: { id: parsed.data.batchId },
      select: { id: true, name: true },
    }),
  ]);

  if (!participant) return { error: "Peserta tidak ditemukan." };

  const generatedPassword = `ISG-${crypto.randomBytes(5).toString("base64url")}`;
  const newPasswordHash = await bcrypt.hash(generatedPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: participant.userId },
      data: {
        status: "VERIFIED",
        passwordHash: newPasswordHash,
        mustChangePassword: true,
      },
    }),
    prisma.participantProfile.update({
      where: { id: participant.id },
      data: { batchId: parsed.data.batchId },
    }),
    prisma.verificationLog.create({
      data: {
        participantId: participant.id,
        status: "VERIFIED",
        note: parsed.data.note || null,
        actedById: session.user.id,
      },
    }),
  ]);

  // Kirim email notifikasi penerimaan & kredensial akun
  const baseUrl = getAppBaseUrl();
  const emailPayload = buildVerificationSuccessEmail({
    name: participant.user.name,
    studentId: participant.studentId,
    email: participant.user.email,
    batchName: batch?.name ?? "Angkatan ISG",
    passwordText: generatedPassword,
    loginUrl: `${baseUrl}/login`,
    note: parsed.data.note || null,
  });

  const emailResult = await sendEmail({
    to: participant.user.email,
    ...emailPayload,
  });

  if (!emailResult.success) {
    return {
      error: `Peserta sudah diverifikasi, tetapi email gagal dikirim: ${emailResult.error ?? "kesalahan SMTP"}. Coba kirim ulang.`,
    };
  }

  revalidatePath("/dashboard/pendaftar");
  return { success: true };
}

const noteSchema = z.object({
  participantId: z.string().min(1),
  note: z.string().min(1, "Catatan wajib diisi."),
});

export async function rejectApplicant(
  _prevState: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Catatan wajib diisi." };

  const participant = await prisma.participantProfile.findUnique({
    where: { id: parsed.data.participantId },
    include: { user: true },
  });
  if (!participant) return { error: "Peserta tidak ditemukan." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: participant.userId }, data: { status: "REJECTED" } }),
    prisma.verificationLog.create({
      data: {
        participantId: participant.id,
        status: "REJECTED",
        note: parsed.data.note,
        actedById: session.user.id,
      },
    }),
  ]);

  const emailPayload = buildApplicantRejectionEmail({
    name: participant.user.name,
    note: parsed.data.note,
  });

  sendEmail({
    to: participant.user.email,
    ...emailPayload,
  }).catch((err) => {
    console.error("[verification] Gagal mengirim email penolakan:", err);
  });

  revalidatePath("/dashboard/pendaftar");
  return { success: true };
}

export async function requestRevision(
  _prevState: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Catatan wajib diisi." };

  const participant = await prisma.participantProfile.findUnique({
    where: { id: parsed.data.participantId },
    include: { user: true },
  });
  if (!participant) return { error: "Peserta tidak ditemukan." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: participant.userId }, data: { status: "REVISION_REQUIRED" } }),
    prisma.verificationLog.create({
      data: {
        participantId: participant.id,
        status: "REVISION_REQUIRED",
        note: parsed.data.note,
        actedById: session.user.id,
      },
    }),
  ]);

  const baseUrl = getAppBaseUrl();
  const emailPayload = buildApplicantRevisionEmail({
    name: participant.user.name,
    note: parsed.data.note,
    statusUrl: `${baseUrl}/register/status/${participant.registrationNumber}`,
  });

  sendEmail({
    to: participant.user.email,
    ...emailPayload,
  }).catch((err) => {
    console.error("[verification] Gagal mengirim email revisi:", err);
  });

  revalidatePath("/dashboard/pendaftar");
  return { success: true };
}
