import { AccountStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ApplicantManager } from "@/features/verification/components/ApplicantManager";

/**
 * Nilai status divalidasi terhadap enum Prisma sebelum dipakai di query.
 * Sebelumnya nilai mentah dari URL langsung di-cast, sehingga `?status=FOO`
 * membuat Prisma melempar error dan halaman ini balas 500.
 */
const VALID_STATUS = new Set<string>(Object.values(AccountStatus));

function parseStatus(raw: string | undefined) {
  if (!raw) return "PENDING";
  if (raw === "ALL" || VALID_STATUS.has(raw)) return raw;
  return "PENDING";
}

export default async function PendaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const { status } = await searchParams;
  const currentStatus = parseStatus(status);

  const where =
    currentStatus === "ALL"
      ? {}
      : { user: { status: currentStatus as AccountStatus } };

  const [applicants, batches] = await Promise.all([
    prisma.participantProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            photoUrl: true,
          },
        },
        batch: { select: { id: true, name: true } },
        verificationLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { registeredAt: "desc" },
    }),
    prisma.batch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ApplicantManager
      applicants={applicants}
      batches={batches}
      currentStatus={currentStatus}
    />
  );
}
