import type { Metadata } from "next";
import { Prisma, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { AccountManager } from "@/features/accounts/components/AccountManager";

export const metadata: Metadata = {
  title: "Manajemen Akun",
};

const VALID_ROLE = new Set<string>(Object.values(Role));

function parseRole(raw: string | undefined) {
  if (!raw || raw === "ALL") return "ALL";
  return VALID_ROLE.has(raw) ? raw : "ALL";
}

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const session = await auth();
  const admin = requireRole(session, ["ADMIN"]);

  const { role: rawRole, q: rawQuery } = await searchParams;
  const role = parseRole(rawRole);
  const query = (rawQuery ?? "").trim().slice(0, 60);

  const where: Prisma.UserWhereInput = {
    ...(role === "ALL" ? {} : { role: role as Role }),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const accounts = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      position: true,
      photoUrl: true,
      createdAt: true,
      participantProfile: { select: { studentId: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AccountManager
      accounts={accounts}
      currentRole={role}
      query={query}
      currentUserId={admin.id}
    />
  );
}
