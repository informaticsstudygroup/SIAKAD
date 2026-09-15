import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Paperclip } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { GradeList } from "@/features/assignment/components/GradeList";
import {
  ASSIGNMENT_CATEGORY_LABEL,
  formatDeadline,
} from "@/features/assignment/types";

export const metadata: Metadata = { title: "Penilaian Tugas" };

export default async function PenilaianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requireRole(session, ["ADMIN", "MENTOR", "CO_MENTOR"]);

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      meeting: { select: { title: true } },
      submissions: {
        include: {
          participant: {
            select: { id: true, studentId: true, user: { select: { name: true } } },
          },
        },
        orderBy: { submittedAt: "asc" },
      },
    },
  });

  if (!assignment) notFound();

  const graded = assignment.submissions.filter((s) => s.score !== null).length;

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div>
        <Link
          href="/dashboard/tugas"
          className="-ml-3 mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          Kembali ke Tugas
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-isg-blue/10 px-2.5 py-1 text-xs font-bold text-isg-blue">
            {ASSIGNMENT_CATEGORY_LABEL[assignment.category]}
          </span>
          {assignment.meeting ? (
            <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
              {assignment.meeting.title}
            </span>
          ) : null}
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-isg-ink">
          {assignment.title}
        </h1>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-isg-muted">
          <span className="flex items-center gap-1.5">
            <CalendarClock size={14} aria-hidden />
            Batas {formatDeadline(assignment.deadline)}
          </span>
          <span>
            {graded}/{assignment.submissions.length} sudah dinilai
          </span>
          {assignment.attachmentUrl ? (
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-semibold text-isg-blue hover:underline"
            >
              <Paperclip size={14} aria-hidden />
              Lampiran
            </a>
          ) : null}
        </div>
      </div>

      <p className="whitespace-pre-wrap rounded-card bg-isg-tint p-4 text-sm text-isg-ink-soft">
        {assignment.description}
      </p>

      <GradeList submissions={assignment.submissions} />
    </div>
  );
}
