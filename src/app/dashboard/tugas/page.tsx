import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { AssignmentBoard } from "@/features/assignment/components/AssignmentBoard";

export const metadata: Metadata = { title: "Tugas" };

const STAFF = ["ADMIN", "MENTOR", "CO_MENTOR"] as const;

export default async function TugasPage() {
  const session = await auth();
  const user = requireRole(session, [
    "ADMIN",
    "MENTOR",
    "CO_MENTOR",
    "ADVISOR",
    "PARTICIPANT",
  ]);
  const canManage = STAFF.includes(user.role as (typeof STAFF)[number]);
  // Advisor memantau: melihat semua, tapi tidak pernah bisa mengubah.
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

  // Peserta hanya melihat tugas yang tidak terikat pertemuan, atau yang
  // pertemuannya ada di angkatannya.
  const where = canViewAll
    ? {}
    : {
        OR: [
          { meetingId: null },
          { meeting: { batchId: batchId ?? "__tanpa_angkatan__" } },
        ],
      };

  const [assignments, meetings, totalParticipants] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        meeting: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
        ...(participantId
          ? {
              submissions: {
                where: { participantId },
                select: {
                  id: true,
                  fileUrl: true,
                  status: true,
                  score: true,
                  feedback: true,
                  submittedAt: true,
                },
              },
            }
          : {}),
      },
      orderBy: { deadline: "desc" },
    }),
    canManage
      ? prisma.meeting.findMany({
          select: { id: true, title: true },
          orderBy: { date: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    prisma.participantProfile.count(),
  ]);

  const rows = assignments.map((item) => {
    const { submissions, ...rest } = item as typeof item & {
      submissions?: NonNullable<
        Parameters<typeof AssignmentBoard>[0]["assignments"][number]["mySubmission"]
      >[];
    };
    return {
      ...rest,
      mySubmission: submissions?.[0] ?? null,
    };
  });

  return (
    <AssignmentBoard
      assignments={rows}
      meetings={meetings}
      canManage={canManage}
      totalParticipants={totalParticipants}
    />
  );
}
