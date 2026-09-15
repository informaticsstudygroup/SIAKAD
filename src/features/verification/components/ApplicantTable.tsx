"use client";

import { Eye } from "lucide-react";
import { formatDateID } from "@/utils/format-date";
import { ACCOUNT_STATUS_META } from "@/features/verification/status-meta";
import type { ApplicantWithRelations } from "@/features/verification/types";

export function ApplicantTable({
  applicants,
  onView,
}: {
  applicants: ApplicantWithRelations[];
  onView: (applicant: ApplicantWithRelations) => void;
}) {
  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center">
        <p className="text-sm font-medium text-[#102033]">Tidak ada pendaftar pada status ini.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] text-xs font-medium text-[#64748B]">
            <th className="px-5 py-3">No. Pendaftaran</th>
            <th className="px-5 py-3">Nama</th>
            <th className="px-5 py-3">NIM</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Tanggal Daftar</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => {
            const meta = ACCOUNT_STATUS_META[applicant.user.status];
            return (
              <tr key={applicant.id} className="border-b border-[#E2E8F0] last:border-0">
                <td className="px-5 py-4 font-medium text-[#102033]">{applicant.registrationNumber}</td>
                <td className="px-5 py-4 text-[#102033]">{applicant.user.name}</td>
                <td className="px-5 py-4 text-[#102033]">{applicant.studentId}</td>
                <td className="px-5 py-4 text-[#64748B]">{applicant.user.email}</td>
                <td className="px-5 py-4 text-[#64748B]">{formatDateID(applicant.registeredAt)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.color}`}>
                    {meta.title}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onView(applicant)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0C81E4] hover:bg-[#0C81E4]/10"
                  >
                    <Eye size={14} aria-hidden />
                    Lihat Detail
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
