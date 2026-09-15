"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BatchTable } from "@/features/batch/components/BatchTable";
import { BatchFormDrawer } from "@/features/batch/components/BatchFormDrawer";
import { DeleteBatchDialog } from "@/features/batch/components/DeleteBatchDialog";
import type { BatchWithRelations, MentorOption } from "@/features/batch/types";

export function BatchManager({
  batches,
  mentors,
  coMentors,
}: {
  batches: BatchWithRelations[];
  mentors: MentorOption[];
  coMentors: MentorOption[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BatchWithRelations | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#102033]">Kelola Angkatan</h1>
          <p className="text-sm text-[#64748B]">Atur angkatan, periode, kapasitas, dan mentor pengampu.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBatch(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#0C81E4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a6fc7]"
        >
          <Plus size={16} aria-hidden />
          Tambah Angkatan
        </button>
      </div>

      <BatchTable
        batches={batches}
        onEdit={(batch) => {
          setEditingBatch(batch);
          setFormOpen(true);
        }}
        onDeleteRequest={setDeleteTarget}
      />

      {formOpen ? (
        <BatchFormDrawer
          batch={editingBatch}
          mentors={mentors}
          coMentors={coMentors}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteBatchDialog batch={deleteTarget} onClose={() => setDeleteTarget(null)} />
      ) : null}
    </div>
  );
}
