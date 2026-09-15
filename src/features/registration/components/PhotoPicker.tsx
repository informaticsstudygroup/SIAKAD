"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Trash2, UserRound } from "lucide-react";

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB sebelum dikecilkan
const OUTPUT_SIZE = 256;

/**
 * Foto dikecilkan di browser jadi 256x256 JPEG lalu disimpan sebagai data URL.
 * Proyek ini belum punya object storage, dan avatar sekecil ini (~20-40 KB)
 * masih wajar disimpan di kolom photoUrl. Kalau nanti sudah ada S3 atau
 * Supabase Storage, cukup ganti bagian yang menghasilkan `dataUrl`.
 */
async function resizeToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  // Ambil bagian tengah berbentuk bujur sangkar, supaya wajah tidak gepeng.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Sengaja TIDAK merender hidden input sendiri: komponen ini hidup di dalam satu
 * langkah Stepper yang lepas dari DOM saat pindah langkah, sehingga nilainya
 * tidak akan ikut terkirim. Hidden input photoUrl dirender di level form.
 */
export function PhotoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // biar file yang sama bisa dipilih lagi
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("Ukuran gambar maksimal 8 MB.");
      return;
    }

    setBusy(true);
    try {
      onChange(await resizeToDataUrl(file));
    } catch {
      setError("Gambar gagal diproses. Coba file lain.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-isg-ink">
        Foto Profil <span className="font-medium text-isg-muted">(opsional)</span>
      </span>

      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-isg-tint ring-1 ring-isg-line">
          {value ? (
            <Image src={value} alt="Pratinjau foto profil" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-isg-muted">
              <UserRound size={26} aria-hidden />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-isg-line px-3.5 py-2 text-xs font-bold text-isg-ink transition-colors hover:border-isg-blue hover:text-isg-blue disabled:opacity-60"
            >
              <Camera size={14} aria-hidden />
              {busy ? "Memproses..." : value ? "Ganti foto" : "Unggah foto"}
            </button>

            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-isg-muted transition-colors hover:text-isg-bad"
              >
                <Trash2 size={14} aria-hidden />
                Hapus
              </button>
            ) : null}
          </div>

          <p className="text-xs text-isg-muted">
            {error ? (
              <span className="font-semibold text-isg-bad">{error}</span>
            ) : (
              "Boleh dilewati, bisa ditambahkan nanti setelah masuk."
            )}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        aria-label="Pilih foto profil"
      />
    </div>
  );
}
