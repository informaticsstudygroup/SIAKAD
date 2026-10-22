"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { QuizStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageBatch, getManagedBatchScope } from "@/lib/scope";
import { OPTION_IDS, gradeAnswers, type QuizOption } from "@/features/quiz/types";

export type QuizFormState = { error?: string; success?: boolean };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"];
const DB_DOWN =
  "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.";
const NO_ACCESS = "Kamu tidak memiliki akses untuk aksi ini.";

/** Kelonggaran untuk jaringan lambat saat kiriman otomatis di detik terakhir. */
const SUBMIT_GRACE_MS = 2 * 60_000;

async function assertStaff() {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) return null;
  return session;
}

/**
 * Staf yang boleh mengubah soal kuis ini. Mentor hanya untuk angkatan yang
 * dia dampingi; tanpa cek ini mentor bisa mengubah soal angkatan lain lewat
 * pemanggilan action langsung.
 */
async function assertCanManageQuiz(quizId: string) {
  const session = await assertStaff();
  if (!session) return null;
  const [scope, quiz] = await Promise.all([
    getManagedBatchScope(session),
    prisma.quiz.findUnique({ where: { id: quizId }, select: { batchId: true } }),
  ]);
  if (!scope || !quiz || !canManageBatch(scope, quiz.batchId)) return null;
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
  if (!session) return { error: NO_ACCESS };

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
  if (!session) return { error: NO_ACCESS };

  const result = await guard("menghapus kuis", () =>
    prisma.quiz.delete({ where: { id } }),
  );
  if ("error" in result) return result;

  revalidatePath("/dashboard/kuis");
  return {};
}

// ================= Kelola soal =================

const optionSchema = z.object({
  id: z.enum(OPTION_IDS),
  text: z.string().trim().min(1, "Teks pilihan tidak boleh kosong."),
});

const questionSchema = z.object({
  id: z.string().optional(),
  quizId: z.string().min(1),
  text: z.string().trim().min(5, "Pertanyaan minimal 5 karakter."),
  options: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Pilihan jawaban tidak valid." });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(optionSchema)
        .min(2, "Minimal 2 pilihan jawaban.")
        .max(OPTION_IDS.length, `Maksimal ${OPTION_IDS.length} pilihan jawaban.`),
    ),
  correctOption: z.enum(OPTION_IDS, { message: "Tandai satu jawaban yang benar." }),
  points: z.coerce
    .number()
    .int("Poin harus bilangan bulat.")
    .min(1, "Poin minimal 1.")
    .max(100, "Poin maksimal 100."),
});

function revalidateQuiz(quizId: string) {
  revalidatePath(`/dashboard/kuis/${quizId}`);
  revalidatePath("/dashboard/kuis");
}

/**
 * Menulis ulang urutan soal menjadi 1, 2, 3, ... Urutan lama bisa bolong atau
 * kembar setelah soal dihapus, karena soal baru dulu diberi nomor dari
 * jumlah soal, bukan dari nomor terbesar.
 */
async function writeOrder(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.question.update({ where: { id }, data: { order: index + 1 } }),
    ),
  );
}

async function orderedQuestionIds(quizId: string) {
  const rows = await prisma.question.findMany({
    where: { quizId },
    select: { id: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => r.id);
}

export async function saveQuestion(
  _prevState: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { id, quizId, text, options, correctOption, points } = parsed.data;

  if (!(await assertCanManageQuiz(quizId))) return { error: NO_ACCESS };

  if (new Set(options.map((o) => o.id)).size !== options.length) {
    return { error: "Pilihan jawaban tidak valid." };
  }
  // Kunci jawaban harus menunjuk pilihan yang benar-benar ada.
  if (!options.some((o) => o.id === correctOption)) {
    return { error: "Tandai satu jawaban yang benar." };
  }

  const data = { text, options: options as QuizOption[], correctOption, points };

  const result = await guard("menyimpan soal", async () => {
    if (id) {
      return prisma.question.update({ where: { id, quizId }, data });
    }
    const last = await prisma.question.aggregate({
      where: { quizId },
      _max: { order: true },
    });
    return prisma.question.create({
      data: { ...data, quizId, order: (last._max.order ?? 0) + 1 },
    });
  });
  if ("error" in result) return result;

  revalidateQuiz(quizId);
  return { success: true };
}

export async function duplicateQuestion(
  id: string,
  quizId: string,
): Promise<{ error?: string }> {
  if (!(await assertCanManageQuiz(quizId))) return { error: NO_ACCESS };

  const result = await guard("menduplikasi soal", async () => {
    const source = await prisma.question.findUnique({ where: { id, quizId } });
    if (!source) return;
    const copy = await prisma.question.create({
      data: {
        quizId,
        text: source.text,
        options: source.options ?? [],
        correctOption: source.correctOption,
        points: source.points,
        order: source.order,
      },
      select: { id: true },
    });
    // Salinan diletakkan tepat di bawah soal aslinya.
    const ids = (await orderedQuestionIds(quizId)).filter((q) => q !== copy.id);
    ids.splice(ids.indexOf(id) + 1, 0, copy.id);
    await writeOrder(ids);
  });
  if ("error" in result) return result;

  revalidateQuiz(quizId);
  return {};
}

export async function moveQuestion(
  id: string,
  quizId: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  if (!(await assertCanManageQuiz(quizId))) return { error: NO_ACCESS };

  const result = await guard("memindahkan soal", async () => {
    const ids = await orderedQuestionIds(quizId);
    const from = ids.indexOf(id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await writeOrder(ids);
  });
  if ("error" in result) return result;

  revalidateQuiz(quizId);
  return {};
}

export async function deleteQuestion(
  id: string,
  quizId: string,
): Promise<{ error?: string }> {
  if (!(await assertCanManageQuiz(quizId))) return { error: NO_ACCESS };

  const result = await guard("menghapus soal", async () => {
    await prisma.question.delete({ where: { id, quizId } });
    await writeOrder(await orderedQuestionIds(quizId));
  });
  if ("error" in result) return result;

  revalidateQuiz(quizId);
  return {};
}

/**
 * Menilai ulang semua jawaban yang sudah dikumpulkan memakai soal dan kunci
 * jawaban terbaru. Dipakai setelah kunci jawaban diperbaiki. Nilai yang
 * diubah manual di rekap nilai ikut tertimpa, dan itu dijelaskan di dialog
 * konfirmasinya.
 */
export async function regradeQuiz(
  quizId: string,
): Promise<{ error?: string; updated?: number }> {
  if (!(await assertCanManageQuiz(quizId))) return { error: NO_ACCESS };

  const result = await guard("menilai ulang kuis", async () => {
    const [questions, attempts] = await Promise.all([
      prisma.question.findMany({
        where: { quizId },
        select: { id: true, correctOption: true, points: true },
      }),
      prisma.quizAttempt.findMany({
        where: { quizId, submittedAt: { not: null } },
        select: { id: true, answers: true },
      }),
    ]);
    await prisma.$transaction(
      attempts.map((attempt) =>
        prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            score: gradeAnswers(
              questions,
              (attempt.answers ?? {}) as Record<string, string>,
            ).score,
          },
        }),
      ),
    );
    return attempts.length;
  });
  if ("error" in result) return result;

  revalidateQuiz(quizId);
  revalidatePath("/dashboard/rekap-nilai");
  return { updated: result.data };
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
        durationMinutes: true,
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
      select: { startedAt: true, submittedAt: true },
    });
    if (!existing) {
      return { error: "Buka halaman kuis terlebih dahulu sebelum mengumpulkan." };
    }
    if (existing.submittedAt) {
      return { error: "Kamu sudah mengumpulkan kuis ini." };
    }

    // Sebelumnya jawaban diterima kapan saja selama kuis masih aktif, jadi
    // batas durasi hanya berlaku di tampilan.
    const deadline = Math.min(
      existing.startedAt.getTime() + quiz.durationMinutes * 60_000,
      quiz.endAt.getTime(),
    );
    if (Date.now() > deadline + SUBMIT_GRACE_MS) {
      return { error: "Waktu pengerjaan kuis ini sudah habis." };
    }

    const { score, correct } = gradeAnswers(quiz.questions, answers);

    await prisma.quizAttempt.update({
      where: {
        quizId_participantId: { quizId: quiz.id, participantId: profile.id },
      },
      data: { answers, score, submittedAt: new Date() },
    });

    revalidatePath("/dashboard/kuis");
    return { score, total: quiz.questions.length, correct };
  } catch (error) {
    console.error("[kuis] gagal menyimpan jawaban:", error);
    return { error: DB_DOWN };
  }
}
