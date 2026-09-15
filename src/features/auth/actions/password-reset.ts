"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/transporter";
import {
  buildPasswordResetEmail,
  buildPasswordChangedEmail,
} from "@/lib/email/templates/password-reset-email";

export type ResetRequestState = { error?: string; sent?: boolean };
export type ResetConfirmState = { error?: string; done?: boolean };

/** Tautan reset hanya berlaku satu jam. */
const TOKEN_TTL_MINUTES = 60;

function getAppBaseUrl(): string {
  const strip = (url: string) => url.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return strip(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.AUTH_URL) return strip(process.env.AUTH_URL);
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${strip(process.env.RAILWAY_PUBLIC_DOMAIN)}`;
  return "http://localhost:3000";
}

/** Token mentah hanya ada di email; basis data menyimpan hash-nya. */
function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ================= Langkah 1: minta tautan =================

const requestSchema = z.object({
  identifier: z.string().trim().min(1, "Masukkan email atau NIM kamu."),
});

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const identifier = parsed.data.identifier;

  try {
    // Pencarian mengikuti aturan login: ada "@" berarti email, selain itu NIM.
    const user = identifier.includes("@")
      ? await prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
          select: { id: true, name: true, email: true, status: true },
        })
      : await prisma.participantProfile
          .findUnique({
            where: { studentId: identifier },
            select: {
              user: { select: { id: true, name: true, email: true, status: true } },
            },
          })
          .then((p) => p?.user ?? null);

    // Akun yang belum diverifikasi atau dinonaktifkan tidak dikirimi tautan —
    // tapi jawabannya tetap sama, supaya orang luar tidak bisa menebak akun
    // mana yang ada lewat perbedaan pesan.
    if (user && user.status === "VERIFIED") {
      const raw = crypto.randomBytes(32).toString("base64url");

      // Tautan lama miliknya dianggap hangus begitu yang baru dibuat.
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
        },
      });

      const payload = buildPasswordResetEmail({
        name: user.name,
        resetUrl: `${getAppBaseUrl()}/reset-password?token=${raw}`,
        minutes: TOKEN_TTL_MINUTES,
      });
      const result = await sendEmail({ to: user.email, ...payload });

      if (!result.success) {
        console.error("[reset] gagal mengirim tautan:", result.error);
        return {
          error:
            "Tautan gagal dikirim karena masalah di server email. Coba lagi beberapa saat lagi.",
        };
      }
    }

    return { sent: true };
  } catch (error) {
    console.error("[reset] gagal memproses permintaan:", error);
    return {
      error: "Server sedang tidak bisa menghubungi database. Coba lagi sebentar lagi.",
    };
  }
}

// ================= Langkah 2: pasang kata sandi baru =================

const confirmSchema = z
  .object({
    token: z.string().min(10, "Tautan tidak lengkap."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi kata sandi belum sama.",
    path: ["confirmPassword"],
  });

export async function confirmPasswordReset(
  _prev: ResetConfirmState,
  formData: FormData,
): Promise<ResetConfirmState> {
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      select: {
        id: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return {
        error:
          "Tautan ini sudah tidak berlaku. Tautan hanya bisa dipakai sekali dan kedaluwarsa setelah satu jam. Minta tautan baru.",
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.user.id },
        // mustChangePassword dimatikan: pengguna baru saja memilih sendiri.
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Tautan lain miliknya ikut hangus.
      prisma.passwordResetToken.deleteMany({
        where: { userId: record.user.id, usedAt: null },
      }),
    ]);

    // Pemberitahuan ini penting: kalau bukan dia yang mengganti, dia jadi tahu.
    const payload = buildPasswordChangedEmail({
      name: record.user.name,
      loginUrl: `${getAppBaseUrl()}/login`,
    });
    const notice = await sendEmail({ to: record.user.email, ...payload });
    if (!notice.success) {
      console.error("[reset] kata sandi berhasil diganti, email pemberitahuan gagal:", notice.error);
    }

    return { done: true };
  } catch (error) {
    console.error("[reset] gagal mengganti kata sandi:", error);
    return {
      error: "Server sedang tidak bisa menghubungi database. Coba lagi sebentar lagi.",
    };
  }
}
