import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { QuizBoard } from "@/features/quiz/components/QuizBoard";
import { batchWhere, getManagedBatchScope } from "@/lib/scope";

export const metadata: Metadata = { title: "Kuis" };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"] as const;

export default async function KuisPage() {
  const session = await auth();
  const user = requireRole(session, [
    "ADMIN",
    "MENTOR",
    "CO_MENTOR",
    "ADVISOR",
    "PARTICIPANT",
  ]);
  const canManage = STAFF.includes(user.role as (typeof STAFF)[number]);
  // Advisor memantau: melihat semua kuis, tapi tidak pernah bisa mengubah.
  const canViewAll = canManage || user.role === "ADVISOR";

  let participantId: string | undefined;
  let batchId: string | null = null;
  if (user.role === "PARTICIPANT") {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, batchId: true },
    });
    participantId = profile?.id;
    batchId = profile?.batchId ?? null;
  }

  // Mentor hanya melihat kuis angkatan yang dia kelola.
  const scope =
    user.role === "MENTOR" || user.role === "CO_MENTOR"
      ? await getManagedBatchScope(session)
      : null;
  const staffWhere = scope ? batchWhere(scope) : {};

  const [quizzes, batches] = await Promise.all([
    prisma.quiz.findMany({
      // Peserta tidak boleh melihat kuis yang masih draf.
      where: canViewAll
        ? staffWhere
        : { batchId: batchId ?? "__tanpa_angkatan__", status: { not: "DRAFT" } },
      include: {
        batch: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
        ...(participantId
          ? {
              attempts: {
                where: { participantId },
                select: {
                  id: true,
                  score: true,
                  startedAt: true,
                  submittedAt: true,
                },
              },
            }
          : {}),
      },
      orderBy: { startAt: "desc" },
    }),
    canManage
      ? prisma.batch.findMany({
          where:
            user.role === "ADMIN"
              ? { isActive: true }
              : { isActive: true, OR: [{ mentorId: user.id }, { coMentorId: user.id }] },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rows = quizzes.map((quiz) => {
    const { attempts, ...rest } = quiz as typeof quiz & {
      attempts?: {
        id: string;
        score: number | null;
        startedAt: Date;
        submittedAt: Date | null;
      }[];
    };
    return { ...rest, myAttempt: attempts?.[0] ?? null };
  });

  return <QuizBoard quizzes={rows} batches={batches} canManage={canManage} />;
}
