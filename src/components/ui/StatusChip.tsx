import { cn } from "@/utils/cn";

export type StatusKind =
  | "HADIR"
  | "IZIN"
  | "TIDAK_HADIR"
  | "BELUM_DINILAI"
  | "SUDAH_DINILAI"
  | "TERLAMBAT"
  | "AKTIF"
  | "SELESAI";

const STATUS_CONFIG: Record<StatusKind, { label: string; text: string; bg: string; dot: string }> = {
  HADIR: { label: "Hadir", text: "text-[#16A36A]", bg: "bg-[#16A36A]/10", dot: "bg-[#16A36A]" },
  IZIN: { label: "Izin", text: "text-[#B45309]", bg: "bg-[#F59E0B]/10", dot: "bg-[#F59E0B]" },
  TIDAK_HADIR: { label: "Tidak Hadir", text: "text-[#E5484D]", bg: "bg-[#E5484D]/10", dot: "bg-[#E5484D]" },
  BELUM_DINILAI: { label: "Belum Dinilai", text: "text-[#64748B]", bg: "bg-[#64748B]/10", dot: "bg-[#64748B]" },
  SUDAH_DINILAI: { label: "Sudah Dinilai", text: "text-[#0C81E4]", bg: "bg-[#0C81E4]/10", dot: "bg-[#0C81E4]" },
  TERLAMBAT: { label: "Terlambat", text: "text-[#B45309]", bg: "bg-[#F59E0B]/10", dot: "bg-[#F59E0B]" },
  AKTIF: { label: "Aktif", text: "text-[#0891A6]", bg: "bg-[#11C4D4]/10", dot: "bg-[#11C4D4]" },
  SELESAI: { label: "Selesai", text: "text-[#0F9463]", bg: "bg-[#4FE7AF]/15", dot: "bg-[#4FE7AF]" },
};

export function StatusChip({ status, className }: { status: StatusKind; className?: string }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
