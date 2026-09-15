import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ScheduleManager } from "@/features/schedule/components/ScheduleManager";
import { batchWhere, getManagedBatchScope } from "@/lib/scope";

export const metadata: Metadata = { title: "Jadwal" };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"] as const;

export default async function JadwalPage() {
  const session = await auth();
  const user = requireRole(session, [
    "ADMIN",
    "MENTOR",
    "CO_MENTOR",
    "ADVISOR",
    "PARTICIPANT",
  ]);

  const canManage = STAFF.includes(user.role as (typeof STAFF)[number]);

  // Peserta melihat angkatannya sendiri; mentor melihat angkatan yang dia
  // kelola; admin dan advisor melihat semuanya.
  let where = {};
  if (user.role === "PARTICIPANT") {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId: user.id },
      select: { batchId: true },
    });
    where = { batchId: profile?.batchId ?? "__tanpa_angkatan__" };
  } else if (user.role === "MENTOR" || user.role === "CO_MENTOR") {
    const scope = await getManagedBatchScope(session);
    where = scope ? batchWhere(scope) : { batchId: "__tanpa_angkatan__" };
  }

  const [meetings, batches] = await Promise.all([
    prisma.meeting.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: "desc" },
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

  return (
    <ScheduleManager meetings={meetings} batches={batches} canManage={canManage} />
  );
}
