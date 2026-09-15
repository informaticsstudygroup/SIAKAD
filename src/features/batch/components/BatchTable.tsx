"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDateID } from "@/utils/format-date";
import type { BatchWithRelations } from "@/features/batch/types";

export function BatchTable({
  batches,
  onEdit,
  onDeleteRequest,
}: {
  batches: BatchWithRelations[];
  onEdit: (batch: BatchWithRelations) => void;
  onDeleteRequest: (batch: BatchWithRelations) => void;
}) {
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center">
        <p className="text-sm font-medium text-[#102033]">Belum ada angkatan.</p>
        <p className="text-sm text-[#64748B]">Tambahkan angkatan pertama untuk mulai mengelola peserta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] text-xs font-medium text-[#64748B]">
            <th className="px-5 py-3">Nama Angkatan</th>
            <th className="px-5 py-3">Periode</th>
            <th className="px-5 py-3">Mentor</th>
            <th className="px-5 py-3">Peserta</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id} className="border-b border-[#E2E8F0] last:border-0">
              <td className="px-5 py-4">
                <div className="font-medium text-[#102033]">{batch.name}</div>
                <div className="text-xs text-[#64748B]">
                  {formatDateID(batch.startDate, { day: "numeric", month: "short", year: "numeric" })} &ndash;{" "}
                  {formatDateID(batch.endDate, { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </td>
              <td className="px-5 py-4 text-[#102033]">{batch.period}</td>
              <td className="px-5 py-4 text-[#102033]">
                {batch.mentor?.name ?? <span className="text-[#94A3B8]">Belum ditentukan</span>}
              </td>
              <td className="px-5 py-4 text-[#102033]">
                {batch._count.participants}/{batch.capacity}
              </td>
              <td className="px-5 py-4">
                <span
                  className={
                    batch.isActive
                      ? "rounded-full bg-[#16A36A]/10 px-2.5 py-1 text-xs font-medium text-[#16A36A]"
                      : "rounded-full bg-[#64748B]/10 px-2.5 py-1 text-xs font-medium text-[#64748B]"
                  }
                >
                  {batch.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label={`Ubah ${batch.name}`}
                    onClick={() => onEdit(batch)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F7FAFC] hover:text-[#0C81E4]"
                  >
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${batch.name}`}
                    onClick={() => onDeleteRequest(batch)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E5484D]/10 hover:text-[#E5484D]"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
