import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token QR presensi.
 *
 * QR di layar mentor berganti tiap ROTATE_SECONDS. Tokennya bukan angka acak
 * yang disimpan di database, melainkan HMAC dari (meetingId + jendela waktu)
 * memakai AUTH_SECRET. Konsekuensinya:
 *
 * - Tangkapan layar QR kedaluwarsa dalam hitungan detik, jadi tidak bisa
 *   disebar ke teman yang tidak hadir.
 * - Tidak perlu tabel sesi atau pembersihan token basi.
 * - Server hanya perlu memeriksa jendela sekarang dan satu jendela sebelumnya,
 *   supaya peserta yang memindai tepat saat pergantian tidak ikut gagal.
 */

export const ROTATE_SECONDS = 20;

/** Jumlah jendela lampau yang masih diterima (toleransi pindai + jam beda). */
const ACCEPTED_PAST_WINDOWS = 2;

function windowIndex(at: Date = new Date()) {
  return Math.floor(at.getTime() / 1000 / ROTATE_SECONDS);
}

function sign(meetingId: string, index: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET belum diisi.");
  return createHmac("sha256", secret)
    .update(`${meetingId}.${index}`)
    .digest("base64url")
    .slice(0, 16);
}

/** Token untuk ditempel ke QR sekarang. */
export function createAttendanceToken(meetingId: string, at: Date = new Date()) {
  const index = windowIndex(at);
  return `${meetingId}.${index}.${sign(meetingId, index)}`;
}

/** Detik tersisa sebelum QR berganti — dipakai untuk cincin hitung mundur. */
export function secondsUntilRotate(at: Date = new Date()) {
  const elapsed = Math.floor(at.getTime() / 1000) % ROTATE_SECONDS;
  return ROTATE_SECONDS - elapsed;
}

export type TokenCheck =
  | { ok: true; meetingId: string }
  | { ok: false; reason: "MALFORMED" | "EXPIRED" };

/** Memeriksa token hasil pindai. Tidak menyentuh database. */
export function verifyAttendanceToken(
  raw: string,
  at: Date = new Date(),
): TokenCheck {
  const parts = raw.trim().split(".");
  if (parts.length !== 3) return { ok: false, reason: "MALFORMED" };

  const [meetingId, rawIndex, signature] = parts;
  const index = Number(rawIndex);
  if (!meetingId || !Number.isInteger(index)) {
    return { ok: false, reason: "MALFORMED" };
  }

  const current = windowIndex(at);
  if (index > current || index < current - ACCEPTED_PAST_WINDOWS) {
    return { ok: false, reason: "EXPIRED" };
  }

  const expected = sign(meetingId, index);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // Panjang harus sama sebelum timingSafeEqual, dan perbandingannya dibuat
  // tahan timing attack meski risikonya di sini kecil.
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "MALFORMED" };
  }

  return { ok: true, meetingId };
}
