"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadBatchParticipantIds, loadGradeColumns } from "@/features/grades/data";

const changesSchema = z
  .array(
    z.object({
      participantId: z.string().min(1),
      kind: z.enum(["quiz", "assignment"]),
      refId: z.string().min(1),
      score: z.number().min(0).max(100).nullable(),
    }),
  )
  .min(1, "Tidak ada perubahan untuk disimpan.")
  .max(5000, "Terlalu banyak perubahan sekaligus. Simpan sebagian dulu.");

/**
 * Menyimpan perubahan nilai dari tabel di halaman Pantau. Hanya Admin; mentor dan
 * advisor hanya bisa melihat tabelnya.
 */
export async function saveGradeChanges(
  batchId: string,
  rawChanges: unknown,
): Promise<{ error?: string; saved?: number }> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return { error: "Hanya Admin yang dapat mengubah nilai." };
  }

  const parsed = changesSchema.safeParse(rawChanges);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data nilai tidak valid." };
  }
  const changes = parsed.data;

  try {
    // Setiap perubahan dicocokkan dengan angkatan yang sedang dibuka, supaya
    // pemanggilan action langsung tidak bisa menyentuh nilai di luarnya.
    const [participantIds, { quizzes, assignments }] = await Promise.all([
      loadBatchParticipantIds(batchId),
      loadGradeColumns(batchId),
    ]);
    const participantSet = new Set(participantIds);
    const quizSet = new Set(quizzes.map((q) => q.id));
    const assignmentSet = new Set(assignments.map((a) => a.id));

    for (const change of changes) {
      const known =
        participantSet.has(change.participantId) &&
        (change.kind === "quiz" ? quizSet : assignmentSet).has(change.refId);
      if (!known) {
        return { error: "Sebagian data sudah berubah. Muat ulang halaman lalu coba lagi." };
      }
      if (change.kind === "quiz" && change.score === null) {
        return { error: "Nilai kuis tidak boleh dikosongkan. Isi 0 bila perlu." };
      }
    }

    const quizChanges = changes.filter((c) => c.kind === "quiz");
    const assignmentChanges = changes.filter((c) => c.kind === "assignment");

    const [attempts, submissions] = await Promise.all([
      quizChanges.length
        ? prisma.quizAttempt.findMany({
            where: {
              OR: quizChanges.map((c) => ({
                quizId: c.refId,
                participantId: c.participantId,
              })),
            },
            select: { quizId: true, participantId: true, submittedAt: true },
          })
        : Promise.resolve([]),
      assignmentChanges.length
        ? prisma.submission.findMany({
            where: {
              OR: assignmentChanges.map((c) => ({
                assignmentId: c.refId,
                participantId: c.participantId,
              })),
            },
            select: { assignmentId: true, participantId: true },
          })
        : Promise.resolve([]),
    ]);

    const attemptByKey = new Map(
      attempts.map((a) => [`${a.quizId}:${a.participantId}`, a]),
    );
    const submissionKeys = new Set(
      submissions.map((s) => `${s.assignmentId}:${s.participantId}`),
    );

    for (const change of assignmentChanges) {
      if (!submissionKeys.has(`${change.refId}:${change.participantId}`)) {
        return { error: "Tugas yang belum dikumpulkan tidak bisa diberi nilai." };
      }
    }

    const now = new Date();
    const round = (value: number) => Math.round(value * 100) / 100;

    await prisma.$transaction([
      ...quizChanges.map((change) => {
        const existing = attemptByKey.get(`${change.refId}:${change.participantId}`);
        const score = round(change.score ?? 0);
        // Kuis yang belum pernah dibuka dibuatkan percobaan berstatus
        // terkumpul, supaya nilainya ikut terhitung di semua rekap.
        return prisma.quizAttempt.upsert({
          where: {
            quizId_participantId: { quizId: change.refId, participantId: change.participantId },
          },
          create: {
            quizId: change.refId,
            participantId: change.participantId,
            answers: {},
            score,
            startedAt: now,
            submittedAt: now,
          },
          update: { score, submittedAt: existing?.submittedAt ?? now },
        });
      }),
      ...assignmentChanges.map((change) =>
        prisma.submission.update({
          where: {
            assignmentId_participantId: {
              assignmentId: change.refId,
              participantId: change.participantId,
            },
          },
          data:
            change.score === null
              ? { score: null, status: "SUDAH_DIKUMPULKAN", gradedById: null, gradedAt: null }
              : {
                  score: round(change.score),
                  status: "SUDAH_DINILAI",
                  gradedById: session.user.id,
                  gradedAt: now,
                },
        }),
      ),
    ]);

    revalidatePath("/dashboard/pantau");
    revalidatePath("/dashboard/nilai");
    revalidatePath("/dashboard/kuis", "layout");
    revalidatePath("/dashboard/tugas", "layout");
    return { saved: changes.length };
  } catch (error) {
    console.error("[pantau] gagal menyimpan nilai:", error);
    return {
      error: "Server sedang tidak bisa menghubungi database. Coba lagi beberapa saat lagi.",
    };
  }
}
