export type GradeKind = "quiz" | "assignment";

export type GradeColumn = {
  /** Kunci unik kolom, misalnya `quiz:<id>` atau `assignment:<id>`. */
  key: string;
  kind: GradeKind;
  refId: string;
  /** Nama pendek berurutan untuk judul kolom, misalnya "Kuis 1" atau "Tugas 3". */
  label: string;
  title: string;
  /** Tanggal kuis dibuka atau tenggat tugas, sudah diformat. */
  dateLabel: string;
};

/**
 * - graded: sudah ada nilai
 * - submitted: tugas sudah dikumpulkan, belum dinilai
 * - in_progress: kuis sudah dibuka peserta tapi belum dikumpulkan
 * - missing: belum ada pengumpulan sama sekali
 */
export type GradeCellState = "graded" | "submitted" | "in_progress" | "missing";

export type GradeCell = { score: number | null; state: GradeCellState };

export type GradeRow = {
  participantId: string;
  name: string;
  studentId: string;
  cells: Record<string, GradeCell>;
  /** Kehadiran dan status sertifikat, ditampilkan di halaman Pantau. */
  progress?: {
    attendancePercent: number | null;
    attendanceLabel: string;
    eligible: boolean;
  };
};

export type GradeSheetData = {
  batchId: string;
  columns: GradeColumn[];
  rows: GradeRow[];
};

export type GradeChange = {
  participantId: string;
  kind: GradeKind;
  refId: string;
  score: number | null;
};

export function columnKey(kind: GradeKind, refId: string) {
  return `${kind}:${refId}`;
}

/**
 * Tugas tanpa pengumpulan tidak bisa diberi nilai, karena nilai tugas melekat
 * pada berkas yang dikumpulkan. Kuis boleh: Admin bisa memasukkan nilai
 * peserta yang mengerjakan di luar sistem, misalnya saat HP-nya bermasalah.
 */
export function isCellEditable(kind: GradeKind, cell: GradeCell | undefined) {
  if (kind === "quiz") return true;
  return Boolean(cell && cell.state !== "missing");
}

/** "" berarti kosong; selain itu harus angka 0–100, koma boleh dipakai. */
export function parseScore(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return { ok: true, value: null };
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(trimmed)) return { ok: false };
  const value = Number(trimmed);
  if (value < 0 || value > 100) return { ok: false };
  return { ok: true, value };
}

export function formatScore(value: number | null) {
  if (value === null) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
