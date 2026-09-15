"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTO_CHARS } from "@/features/registration/constants";

export type ProfileFormState = { error?: string; success?: boolean };

const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";

const profileSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 huruf."),
  phone: z
    .union([z.string().trim().regex(/^[\d+\s-]{9,16}$/, "Nomor telepon 9 sampai 16 digit."), z.literal("")])
    .optional(),
  bio: z.string().trim().max(500, "Bio maksimal 500 karakter.").optional(),
  photoUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith("data:image/"), { message: "Format foto tidak dikenali." })
    .refine((v) => !v || v.length <= MAX_PHOTO_CHARS, { message: "Ukuran foto terlalu besar." }),
});

export async function updateMyProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Kamu harus masuk dulu." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        bio: parsed.data.bio || null,
        photoUrl: parsed.data.photoUrl || null,
      },
    });
  } catch (error) {
    console.error("[profil] gagal menyimpan profil:", error);
    return { error: DB_DOWN };
  }

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi kata sandi belum sama.",
    path: ["confirmPassword"],
  });

export async function changeMyPassword(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Kamu harus masuk dulu." };

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) return { error: "Akun tidak ditemukan." };

    // Kata sandi lama wajib dicocokkan: tanpa ini, sesi yang dibajak bisa
    // langsung mengunci pemilik akun aslinya.
    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) return { error: "Kata sandi saat ini salah." };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error("[profil] gagal mengganti kata sandi:", error);
    return { error: DB_DOWN };
  }

  return { success: true };
}
