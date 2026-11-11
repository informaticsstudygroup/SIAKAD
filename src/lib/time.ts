/**
 * Zona waktu aplikasi. Semua jam yang diketik pengguna dan semua jam yang
 * ditampilkan memakai zona ini, di mana pun server berjalan.
 *
 * Tanpa ini, tanggal dan jam dari form ("2026-11-12" + "19:00") dibaca
 * memakai zona waktu server. Server Railway berjalan di UTC, jadi pertemuan
 * jam 19:00 tersimpan sebagai 19:00 UTC = 03:00 WITA keesokan harinya, dan
 * kuis terbuka 8 jam terlambat.
 *
 * Indonesia tidak memakai jam musim panas, jadi selisihnya selalu tetap.
 */
export const APP_TIME_ZONE = "Asia/Makassar";
const APP_UTC_OFFSET = "+08:00";

/** Tanggal (YYYY-MM-DD) dan jam (HH:mm) dari form, dibaca sebagai WITA. */
export function fromLocalInput(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00${APP_UTC_OFFSET}`);
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Tahun, bulan (1–12), tanggal, jam, dan menit menurut WITA. */
export function localParts(date: Date | string) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(date)).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Nilai untuk <input type="date">, menurut WITA. */
export function toLocalDateInput(date: Date | string) {
  const p = localParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Nilai untuk <input type="time">, menurut WITA. */
export function toLocalTimeInput(date: Date | string) {
  const p = localParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Format tanggal/jam berbahasa Indonesia, selalu dalam WITA. */
export function formatLocal(date: Date | string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: APP_TIME_ZONE, ...options }).format(
    new Date(date),
  );
}
