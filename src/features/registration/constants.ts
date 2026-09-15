/**
 * Konstanta dipisah dari register-action.ts karena file "use server" hanya boleh
 * mengekspor fungsi async — mengekspor konstanta dari sana membuat seluruh
 * ekspor modul ikut hilang saat build.
 */

/** Domain email kampus. Ubah di satu tempat ini kalau kampusnya bertambah. */
export const CAMPUS_EMAIL_DOMAIN = "@unikadelasalle.ac.id";

/** Semua peserta ISG berasal dari Informatika, jadi tidak lagi ditanyakan. */
export const DEFAULT_STUDY_PROGRAM = "Informatika";

/** Panjang minimum alasan bergabung. */
export const REASON_MIN = 20;

/** Avatar 256x256 JPEG biasanya 20-40 KB; 400 KB sudah sangat longgar. */
export const MAX_PHOTO_CHARS = 400_000;
