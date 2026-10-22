import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getManagedBatchScope } from "@/lib/scope";
import { SCORE_TARGET } from "@/features/dashboard/participant/data";
import { loadGradeSheet } from "@/features/grades/data";
import { GradeSheet } from "@/features/grades/components/GradeSheet";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Rekap Nilai" };

export default async function RekapNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["ADMIN", "MENTOR", "CO_MENTOR", "ADVISOR"]);
  const isMentor = user.role === "MENTOR" || user.role === "CO_MENTOR";

  // Mentor hanya melihat angkatan yang dia dampingi; Admin dan Advisor semua.
  const scope = isMentor ? await getManagedBatchScope(session) : null;
  const batches = await prisma.batch.findMany({
    where: scope && !scope.all ? { id: { in: scope.ids } } : {},
    select: { id: true, name: true, isActive: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const { batch: rawBatch } = await searchParams;
  const batch = batches.find((b) => b.id === rawBatch) ?? batches[0];

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Rekap Nilai</h1>
        <p className="text-sm text-isg-muted">
          Semua nilai kuis dan tugas per angkatan dalam satu tabel.
          {user.role === "ADMIN" ? " Ketuk sel untuk mengubah nilai." : ""}
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <Users size={30} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum ada angkatan</p>
          <p className="max-w-xs text-sm text-isg-muted">
            {isMentor
              ? "Kamu belum ditugaskan ke angkatan mana pun oleh Admin."
              : "Buat angkatan terlebih dahulu di menu Angkatan."}
          </p>
        </div>
      ) : (
        <>
          {batches.length > 1 ? (
            <nav aria-label="Pilih angkatan" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {batches.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/rekap-nilai?batch=${b.id}`}
                  aria-current={b.id === batch.id ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                    b.id === batch.id
                      ? "bg-isg-ink text-white"
                      : "border border-isg-line bg-isg-surface text-isg-ink-soft hover:border-isg-blue/40",
                  )}
                >
                  {b.name}
                  {!b.isActive ? (
                    <span className="ml-1.5 text-xs font-medium opacity-70">(selesai)</span>
                  ) : null}
                </Link>
              ))}
            </nav>
          ) : null}

          {/* key: data draf di tabel dibuang saat pindah angkatan. */}
          <GradeSheet
            key={batch.id}
            data={await loadGradeSheet(batch.id)}
            batchName={batch.name}
            canEdit={user.role === "ADMIN"}
            scoreTarget={SCORE_TARGET}
          />
        </>
      )}
    </div>
  );
}
