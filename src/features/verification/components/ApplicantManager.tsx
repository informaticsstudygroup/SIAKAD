"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusTabs } from "@/features/verification/components/StatusTabs";
import { ApplicantTable } from "@/features/verification/components/ApplicantTable";
import { ApplicantDetailDrawer } from "@/features/verification/components/ApplicantDetailDrawer";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import type {
  ApplicantWithRelations,
  BatchOption,
} from "@/features/verification/types";

export function ApplicantManager({
  applicants,
  batches,
  currentStatus,
}: {
  applicants: ApplicantWithRelations[];
  batches: BatchOption[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ApplicantWithRelations | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
          Verifikasi Pendaftar
        </h1>
        <p className="text-sm text-isg-muted">
          Tinjau dan verifikasi calon peserta baru ISG.
        </p>
      </div>

      <StatusTabs current={currentStatus} />

      <ApplicantTable applicants={applicants} onView={setSelected} />

      {selected ? (
        <ApplicantDetailDrawer
          applicant={selected}
          batches={batches}
          onClose={() => setSelected(null)}
          onDone={(msg) => {
            // Drawer ditutup dan daftar disegarkan supaya status barunya
            // langsung terlihat, lalu hasilnya diberitahukan lewat toast.
            setSelected(null);
            setToast({ id: Date.now(), ...msg });
            router.refresh();
          }}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
