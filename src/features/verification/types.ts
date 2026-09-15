import type { AccountStatus } from "@prisma/client";

export type ApplicantWithRelations = {
  id: string;
  registrationNumber: string;
  studentId: string;
  studyProgram: string;
  semester: number;
  reason: string | null;
  techInterests: string[];
  registeredAt: Date;
  batchId: string | null;
  batch: { id: string; name: string } | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: AccountStatus;
    photoUrl: string | null;
  };
  verificationLogs: {
    id: string;
    status: AccountStatus;
    note: string | null;
    createdAt: Date;
  }[];
};

export type BatchOption = { id: string; name: string };
