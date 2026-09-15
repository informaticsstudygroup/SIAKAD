import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * Angkatan mana yang boleh dikelola seseorang.
 *
 * Admin mengelola semuanya. Mentor dan Co-Mentor hanya angkatan tempat mereka
 * benar-benar ditugaskan — tanpa ini seorang mentor bisa mengubah, bahkan
 * menghapus, jadwal milik mentor lain.
 */
export type BatchScope = { all: true } | { all: false; ids: string[] };

export async function getManagedBatchScope(
  session: Session | null,
): Promise<BatchScope | null> {
  const user = session?.user;
  if (!user) return null;

  if (user.role === "ADMIN") return { all: true };

  if (user.role === "MENTOR" || user.role === "CO_MENTOR") {
    const batches = await prisma.batch.findMany({
      where: { OR: [{ mentorId: user.id }, { coMentorId: user.id }] },
      select: { id: true },
    });
    return { all: false, ids: batches.map((b) => b.id) };
  }

  return null;
}

/** Filter Prisma untuk kolom batchId sesuai wewenang. */
export function batchWhere(scope: BatchScope) {
  // Daftar kosong sengaja memakai penanda yang tidak mungkin cocok, supaya
  // mentor tanpa angkatan melihat kosong, bukan melihat semuanya.
  return scope.all ? {} : { batchId: { in: scope.ids.length ? scope.ids : ["__none__"] } };
}

export function canManageBatch(scope: BatchScope, batchId: string) {
  return scope.all || scope.ids.includes(batchId);
}
