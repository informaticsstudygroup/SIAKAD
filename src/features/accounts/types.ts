import type { AccountStatus, Role } from "@prisma/client";

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  phone: string | null;
  position: string | null;
  photoUrl: string | null;
  createdAt: Date;
  participantProfile: { studentId: string } | null;
};

/** Peran yang boleh dibuat lewat halaman ini. Peserta datang lewat pendaftaran. */
export const STAFF_ROLES = ["ADMIN", "MENTOR", "CO_MENTOR", "ADVISOR"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  MENTOR: "Mentor",
  CO_MENTOR: "Co-Mentor",
  ADVISOR: "Advisor",
  PARTICIPANT: "Peserta",
};

export const ROLE_TONE: Record<Role, string> = {
  ADMIN: "bg-isg-blue/10 text-isg-blue",
  MENTOR: "bg-isg-cyan/15 text-[#0891a6]",
  CO_MENTOR: "bg-isg-mint/20 text-isg-ok",
  ADVISOR: "bg-isg-sun/20 text-[#a56a00]",
  PARTICIPANT: "bg-isg-tint text-isg-muted",
};
