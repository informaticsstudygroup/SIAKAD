import type { AccountStatus } from "@prisma/client";

export const ACCOUNT_STATUS_META: Record<
  AccountStatus,
  { title: string; description: string; color: string; bg: string }
> = {
  PENDING: {
    title: "Menunggu Verifikasi Admin",
    description:
      "Pendaftaranmu sedang ditinjau oleh Admin. Proses ini biasanya memakan waktu 1-3 hari kerja.",
    color: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
  VERIFIED: {
    title: "Terverifikasi",
    description:
      "Selamat! Akunmu sudah aktif sebagai peserta Informatics Study Group. Kamu sudah bisa masuk ke Informatics Study Group SIAKAD.",
    color: "text-[#16A36A]",
    bg: "bg-[#16A36A]/10",
  },
  REJECTED: {
    title: "Pendaftaran Ditolak",
    description: "Mohon maaf, pendaftaranmu belum dapat kami terima saat ini.",
    color: "text-[#E5484D]",
    bg: "bg-[#E5484D]/10",
  },
  REVISION_REQUIRED: {
    title: "Perlu Revisi Data",
    description:
      "Admin meminta kamu melengkapi atau memperbaiki sebagian data pendaftaran.",
    color: "text-[#0C81E4]",
    bg: "bg-[#0C81E4]/10",
  },
  DISABLED: {
    title: "Akun Dinonaktifkan",
    description:
      "Akun ini telah dinonaktifkan. Hubungi Admin untuk informasi lebih lanjut.",
    color: "text-[#64748B]",
    bg: "bg-[#64748B]/10",
  },
};
