"use client";

import { useState } from "react";
import { StatusTabs } from "@/features/verification/components/StatusTabs";
import { ApplicantTable } from "@/features/verification/components/ApplicantTable";
import { ApplicantDetailDrawer } from "@/features/verification/components/ApplicantDetailDrawer";
import type { ApplicantWithRelations, BatchOption } from "@/features/verification/types";

export function ApplicantManager({
  applicants,
  batches,
  currentStatus,
}: {
  applicants: ApplicantWithRelations[];
  batches: BatchOption[];
  currentStatus: string;
}) {
  const [selected, setSelected] = useState<ApplicantWithRelations | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#102033]">Verifikasi Pendaftar</h1>
        <p className="text-sm text-[#64748B]">Tinjau dan verifikasi calon peserta baru ISG.</p>
      </div>

      <StatusTabs current={currentStatus} />

      <ApplicantTable applicants={applicants} onView={setSelected} />

      {selected ? (
        <ApplicantDetailDrawer applicant={selected} batches={batches} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
