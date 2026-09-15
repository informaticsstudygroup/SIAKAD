"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteBatch } from "@/features/batch/actions/batch-actions";
import type { BatchWithRelations } from "@/features/batch/types";

export function DeleteBatchDialog({
  batch,
  onClose,
}: {
  batch: BatchWithRelations;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteBatch(batch.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <ConfirmDialog
      title={`Hapus ${batch.name}?`}
      description="Tindakan ini tidak dapat dibatalkan. Angkatan yang masih memiliki peserta atau jadwal tidak dapat dihapus."
      confirmLabel="Hapus Angkatan"
      isDanger
      isPending={isPending}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
