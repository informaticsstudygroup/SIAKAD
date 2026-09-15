"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AccountFormState = { error?: string; success?: boolean };

const STAFF_ROLE = z.enum(["ADMIN", "MENTOR", "CO_MENTOR", "ADVISOR"]);

async function assertAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return null;
  return session;
}

const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";

/** Membungkus akses database supaya kegagalannya jadi pesan, bukan halaman crash. */
async function guard<T>(
  label: string,
  run: () => Promise<T>,
): Promise<{ data: T } | { error: string }> {
  try {
    return { data: await run() };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Email itu sudah dipakai akun lain." };
    }
    console.error(`[akun] ${label} gagal:`, error);
    return { error: DB_DOWN };
  }
}

// ================= Buat akun staf =================

const createSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 huruf."),
  email: z.email("Format email tidak valid."),
  role: STAFF_ROLE,
  position: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function createStaffAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const result = await guard("membuat akun staf", () =>
    prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: parsed.data.role,
        // Akun staf dibuat langsung oleh Admin, jadi tidak perlu verifikasi.
        status: "VERIFIED",
        position: parsed.data.position || null,
        phone: parsed.data.phone || null,
      },
    }),
  );

  if ("error" in result) return result;

  revalidatePath("/dashboard/akun");
  return { success: true };
}

// ================= Ubah data akun staf =================

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(3, "Nama minimal 3 huruf."),
  role: STAFF_ROLE,
  position: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
});

export async function updateStaffAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const found = await guard("membaca akun", () =>
    prisma.user.findUnique({ where: { id: parsed.data.id }, select: { role: true } }),
  );
  if ("error" in found) return found;
  if (!found.data) return { error: "Akun tidak ditemukan." };

  if (found.data.role === "PARTICIPANT") {
    return {
      error:
        "Akun peserta tidak bisa diubah di sini karena terikat data pendaftaran dan angkatan.",
    };
  }

  // Admin tidak boleh menurunkan perannya sendiri — bisa mengunci diri keluar.
  if (parsed.data.id === session.user.id && parsed.data.role !== "ADMIN") {
    return { error: "Kamu tidak bisa mengubah peranmu sendiri." };
  }

  const result = await guard("mengubah akun staf", () =>
    prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        position: parsed.data.position || null,
        phone: parsed.data.phone || null,
      },
    }),
  );

  if ("error" in result) return result;

  revalidatePath("/dashboard/akun");
  return { success: true };
}

// ================= Aktif / nonaktif =================

export async function setAccountStatus(
  id: string,
  status: "VERIFIED" | "DISABLED",
): Promise<{ error?: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  if (id === session.user.id) {
    return { error: "Kamu tidak bisa menonaktifkan akunmu sendiri." };
  }

  const result = await guard("mengubah status akun", () =>
    prisma.user.update({ where: { id }, data: { status } }),
  );

  if ("error" in result) return result;

  revalidatePath("/dashboard/akun");
  return {};
}

// ================= Setel ulang kata sandi =================

const resetSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function resetAccountPassword(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const result = await guard("menyetel ulang kata sandi", () =>
    prisma.user.update({ where: { id: parsed.data.id }, data: { passwordHash } }),
  );

  if ("error" in result) return result;

  revalidatePath("/dashboard/akun");
  return { success: true };
}
