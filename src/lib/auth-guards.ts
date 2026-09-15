import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function requireRole(session: Session | null, allowed: Role[]) {
  if (!session?.user) {
    redirect("/login");
  }
  if (!allowed.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session.user;
}
