"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { QuizStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizOption } from "@/features/quiz/types";

export type QuizFormState = { error?: string; success?: boolean };

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
    console.error(`[kuis] ${label} gagal:`, error);
    return { error: DB_DOWN } as const;
  }
}

// ================= Kelola kuis =================

const quizSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Judul kuis minimal 3 huruf."),
    topic: z.string().trim().min(2, "Topik wajib diisi."),
    instructions: z.string().trim().max(2000).optional(),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, "Durasi minimal 1 menit.")
      .max(300, "Durasi maksimal 300 menit."),
    batchId: z.string().min(1, "Pilih angkatan."),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi."),
    startTime: z.string().min(1, "Jam mulai wajib diisi."),
    endDate: z.string().min(1, "Tanggal akhir wajib diisi."),
    endTime: z.string().min(1, "Jam akhir wajib diisi."),
    status: z.enum(QuizStatus),
  })
  .refine(
    (d) =>
      new Date(`${d.endDate}T${d.endTime}:00`) >
      new Date(`${d.startDate}T${d.startTime}:00`),
    { message: "Waktu berakhir harus setelah waktu mulai.", path: ["endTime"] },
  );

export async function saveQuiz(
  _prevState: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = quizSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { id, startDate, startTime, endDate, endTime, instructions, ...rest } =
    parsed.data;

  const data = {
    ...rest,
    instructions: instructions || null,
    startAt: new Date(`${startDate}T${startTime}:00`),
    endAt: new Date(`${endDate}T${endTime}:00`),
    createdById: session.user.id,
  };

  const result = await guard(id ? "mengubah kuis" : "membuat kuis", () =>
    id ? prisma.quiz.update({ where: { id }, data }) : prisma.quiz.create({ data }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/kuis");
  return { success: true };
}

export async function deleteQuiz(id: string): Promise<{ error?: string }> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const result = await guard("menghapus kuis", () =>
    prisma.quiz.delete({ where: { id } }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/kuis");
  return {};
}

// ================= Kelola soal =================

const questionSchema = z.object({
  id: z.string().optional(),
  quizId: z.string().min(1),
  text: z.string().trim().min(5, "Pertanyaan minimal 5 karakter."),
  optionA: z.string().trim().min(1, "Pilihan A wajib diisi."),
  optionB: z.string().trim().min(1, "Pilihan B wajib diisi."),
  optionC: z.string().trim().optional(),
  optionD: z.string().trim().optional(),
  correctOption: z.enum(["a", "b", "c", "d"]),
  points: z.coerce.number().int().min(1).max(100),
});

export async function saveQuestion(
  _prevState: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const options: QuizOption[] = [
    { id: "a", text: parsed.data.optionA },
    { id: "b", text: parsed.data.optionB },
    ...(parsed.data.optionC ? [{ id: "c", text: parsed.data.optionC }] : []),
    ...(parsed.data.optionD ? [{ id: "d", text: parsed.data.optionD }] : []),
  ];

  // Kunci jawaban harus menunjuk pilihan yang benar-benar ada.
  if (!options.some((o) => o.id === parsed.data.correctOption)) {
    return { error: "Kunci jawaban menunjuk pilihan yang kosong." };
  }

  const result = await guard("menyimpan soal", async () => {
    if (parsed.data.id) {
      return prisma.question.update({
        where: { id: parsed.data.id },
        data: {
          text: parsed.data.text,
          options,
          correctOption: parsed.data.correctOption,
          points: parsed.data.points,
        },
      });
    }
    const count = await prisma.question.count({
      where: { quizId: parsed.data.quizId },
    });
    return prisma.question.create({
      data: {
        quizId: parsed.data.quizId,
        text: parsed.data.text,
        options,
        correctOption: parsed.data.correctOption,
        points: parsed.data.points,
        order: count + 1,
      },
    });
  });
  if ("error" in result) return result;

  revalidatePath(`/dashboard/kuis/${parsed.data.quizId}`);
  return { success: true };
}

export async function deleteQuestion(
  id: string,
  quizId: string,
): Promise<{ error?: string }> {
  const session = await assertStaff();
  if (!session) return { error: "Kamu tidak memiliki akses untuk aksi ini." };

  const result = await guard("menghapus soal", () =>
    prisma.question.delete({ where: { id } }),
  );
  if ("error" in result) return result;

  revalidatePath(`/dashboard/kuis/${quizId}`);
  return {};
}

// ================= Peserta mengerjakan =================

/**
 * Menilai jawaban di server. Kunci jawaban tidak pernah dikirim ke klien,
 * jadi peserta tidak bisa membacanya dari network tab.
 */
export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string>,
): Promise<{ error?: string; score?: number; total?: number; correct?: number }> {
  const session = await auth();
  if (session?.user.role !== "PARTICIPANT") {
    return { error: "Hanya peserta yang bisa mengerjakan kuis." };
  }

  try {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, batchId: true },
    });
    if (!profile) return { error: "Profil peserta tidak ditemukan." };

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        batchId: true,
        status: true,
        startAt: true,
        endAt: true,
        questions: { select: { id: true, correctOption: true, points: true } },
      },
    });
    if (!quiz) return { error: "Kuis tidak ditemukan." };
    if (profile.batchId !== quiz.batchId) {
      return { error: "Kuis ini bukan untuk angkatanmu." };
    }
    if (quiz.status !== "ACTIVE") {
      return { error: "Kuis ini sedang tidak aktif." };
    }

    const existing = await prisma.quizAttempt.findUnique({
      where: {
        quizId_participantId: { quizId: quiz.id, participantId: profile.id },
      },
      select: { submittedAt: true },
    });
    if (existing?.submittedAt) {
      return { error: "Kamu sudah mengumpulkan kuis ini." };
    }

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    let earned = 0;
    let correct = 0;
    for (const question of quiz.questions) {
      if (answers[question.id] === question.correctOption) {
        earned += question.points;
        correct += 1;
      }
    }
    const score = totalPoints ? Math.round((earned / totalPoints) * 100) : 0;

    await prisma.quizAttempt.upsert({
      where: {
        quizId_participantId: { quizId: quiz.id, participantId: profile.id },
      },
      create: {
        quizId: quiz.id,
        participantId: profile.id,
        answers,
        score,
        submittedAt: new Date(),
      },
      update: { answers, score, submittedAt: new Date() },
    });

    return { score, total: quiz.questions.length, correct };
  } catch (error) {
    console.error("[kuis] gagal menyimpan jawaban:", error);
    return { error: DB_DOWN };
  }
}
