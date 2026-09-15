"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const batchSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama angkatan wajib diisi."),
    period: z.string().min(1, "Periode wajib diisi."),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi."),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi."),
    capacity: z.coerce.number().int().positive("Kapasitas harus lebih dari 0."),
    mentorId: z.string().optional(),
    coMentorId: z.string().optional(),
    isActive: z.literal("on").optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Tanggal selesai harus setelah tanggal mulai.",
    path: ["endDate"],
  });

export type BatchFormState = { error?: string; success?: boolean };

async function assertAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function saveBatch(
  _prevState: BatchFormState,
  formData: FormData,
): Promise<BatchFormState> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = batchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { id, mentorId, coMentorId, isActive, startDate, endDate, ...rest } = parsed.data;

  const data = {
    ...rest,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    mentorId: mentorId || null,
    coMentorId: coMentorId || null,
    isActive: isActive === "on",
  };

  if (id) {
    await prisma.batch.update({ where: { id }, data });
  } else {
    await prisma.batch.create({ data });
  }

  revalidatePath("/dashboard/angkatan");
  return { success: true };
}

export async function deleteBatch(id: string): Promise<{ error?: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  try {
    await prisma.batch.delete({ where: { id } });
  } catch {
    return { error: "Gagal menghapus angkatan. Kemungkinan masih memiliki peserta atau jadwal terkait." };
  }

  revalidatePath("/dashboard/angkatan");
  return {};
}
