import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { BatchManager } from "@/features/batch/components/BatchManager";

export default async function AngkatanPage() {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const [batches, mentors, coMentors] = await Promise.all([
    prisma.batch.findMany({
      include: {
        mentor: { select: { id: true, name: true } },
        coMentor: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR", status: "VERIFIED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "CO_MENTOR", status: "VERIFIED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <BatchManager batches={batches} mentors={mentors} coMentors={coMentors} />;
}
