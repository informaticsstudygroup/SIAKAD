"use server";

import { redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CAMPUS_EMAIL_DOMAIN,
  DEFAULT_STUDY_PROGRAM,
  MAX_PHOTO_CHARS,
  REASON_MIN,
  REQUIRE_CAMPUS_EMAIL,
} from "@/features/registration/constants";

const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Nama lengkap minimal 3 huruf."),
    studentId: z
      .string()
      .trim()
      .regex(/^\d{6,15}$/, "NIM hanya berisi angka, 6 sampai 15 digit."),
    email: z
      .email("Format email tidak valid.")
      .refine(
        (value) =>
          !REQUIRE_CAMPUS_EMAIL ||
          value.toLowerCase().endsWith(CAMPUS_EMAIL_DOMAIN),
        { message: `Gunakan email kampus yang berakhiran ${CAMPUS_EMAIL_DOMAIN}.` },
      ),
    phone: z
      .string()
      .trim()
      .regex(/^[\d+\s-]{9,16}$/, "Nomor telepon 9 sampai 16 digit."),
    semester: z.coerce.number().int().min(1).max(14, "Semester tidak valid."),
    reason: z.string().trim().min(REASON_MIN, `Ceritakan alasanmu minimal ${REASON_MIN} karakter.`),
    // Dikirim sebagai satu teks bebas dipisah koma, bukan pilihan terbatas.
    techInterests: z.string().optional(),
    photoUrl: z
      .string()
      .optional()
      .refine((value) => !value || value.startsWith("data:image/"), {
        message: "Format foto tidak dikenali.",
      })
      .refine((value) => !value || value.length <= MAX_PHOTO_CHARS, {
        message: "Ukuran foto terlalu besar.",
      }),
    agreement: z.string().optional(),
  })
  .refine((data) => data.agreement === "on", {
    message: "Kamu harus menyetujui syarat dan ketentuan.",
    path: ["agreement"],
  });

export type RegisterFormState = { error?: string };

function generateRegistrationNumber() {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ISG-${yyyymm}-${random}`;
}

/** "Web Development, Machine Learning" -> ["Web Development", "Machine Learning"] */
function parseInterests(raw: string | undefined) {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { name, studentId, phone, semester, reason, photoUrl } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const techInterests = parseInterests(parsed.data.techInterests);

  // Pengecekan ini dulu berada di luar try/catch, sehingga database yang tidak
  // bisa dihubungi memunculkan halaman error runtime, bukan pesan yang wajar.
  let existingEmail;
  let existingNim;
  try {
    [existingEmail, existingNim] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.participantProfile.findUnique({ where: { studentId } }),
    ]);
  } catch (error) {
    console.error("[register] gagal memeriksa data yang sudah ada:", error);
    return {
      error:
        "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.",
    };
  }

  if (existingEmail) return { error: "Email sudah terdaftar. Gunakan email lain atau masuk." };
  if (existingNim) return { error: "NIM sudah terdaftar sebelumnya." };

  // Password dibuat admin saat verifikasi, lalu peserta wajib menggantinya.
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  let registrationNumber = "";
  try {
    registrationNumber = await prisma.$transaction(async (tx) => {
      let attempt = 0;
      let candidate = generateRegistrationNumber();
      // registrationNumber sangat kecil kemungkinan bentrok, tapi tetap retry untuk keamanan.
      while (attempt < 5) {
        const clash = await tx.participantProfile.findUnique({
          where: { registrationNumber: candidate },
        });
        if (!clash) break;
        candidate = generateRegistrationNumber();
        attempt += 1;
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          photoUrl: photoUrl || null,
          passwordHash,
          mustChangePassword: true,
          role: "PARTICIPANT",
          status: "PENDING",
        },
      });

      await tx.participantProfile.create({
        data: {
          userId: user.id,
          registrationNumber: candidate,
          studentId,
          studyProgram: DEFAULT_STUDY_PROGRAM,
          semester,
          reason,
          techInterests,
        },
      });

      return candidate;
    });
  } catch (error) {
    console.error("[register] gagal menyimpan pendaftaran:", error);
    return { error: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." };
  }

  redirect(`/register/status/${registrationNumber}`);
}
