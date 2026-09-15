"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import {
  checkInWithToken,
  type ScanResult,
} from "@/features/attendance/actions/attendance-actions";
import { cn } from "@/utils/cn";

/** Menerima QR berisi URL lengkap maupun token mentah. */
export function extractToken(raw: string) {
  const value = raw.trim();
  try {
    const url = new URL(value);
    return url.searchParams.get("t") ?? "";
  } catch {
    // Bukan URL — anggap token mentah.
    return value;
  }
}

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lockRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const submit = useCallback(
    async (token: string) => {
      // Kunci agar satu QR tidak terkirim berkali-kali dalam beberapa frame.
      if (lockRef.current) return;
      lockRef.current = true;

      stop();
      setSubmitting(true);
      const response = await checkInWithToken(token);
      setSubmitting(false);
      setResult(response);
      lockRef.current = false;
    },
    [stop],
  );

  async function start() {
    setResult(null);
    setCameraError("");

    // Browser menyembunyikan kamera sepenuhnya di konteks tidak aman. Ini
    // terjadi saat aplikasi dibuka dari HP lewat alamat IP jaringan lokal
    // dengan http://. Menyuruh pengguna "mengizinkan kamera" akan sia-sia,
    // jadi penyebab aslinya disebutkan apa adanya.
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        window.isSecureContext === false
          ? "INSECURE"
          : "Browser ini tidak mendukung akses kamera. Coba Chrome atau Safari versi terbaru.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Loop pemindaian sengaja fungsi lokal, bukan useCallback: fungsi yang
      // memanggil dirinya sendiri di dalam hook ditolak React Compiler.
      const loop = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(image.data, image.width, image.height, {
          inversionAttempts: "dontInvert",
        });

        if (found?.data) {
          const token = extractToken(found.data);
          if (token) {
            void submit(token);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setCameraError(
        "Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser, lalu coba lagi.",
      );
    }
  }

  useEffect(() => stop, [stop]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-card border border-isg-line bg-isg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            !scanning && "invisible",
          )}
        />
        <canvas ref={canvasRef} className="hidden" />

        {scanning ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-3/5 w-3/5 rounded-2xl border-4 border-isg-mint/90 shadow-[0_0_0_9999px_rgba(15,23,41,0.45)]" />
          </div>
        ) : null}

        {!scanning && !submitting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white/80">
            <Camera size={34} aria-hidden />
            <p className="text-sm font-semibold">
              Arahkan kamera ke kode QR yang ditampilkan mentor
            </p>
          </div>
        ) : null}

        {submitting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-isg-ink/85 text-white">
            <Loader2 size={30} aria-hidden className="animate-spin" />
            <p className="text-sm font-bold">Mencatat kehadiran...</p>
          </div>
        ) : null}
      </div>

      {result ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-card border p-4",
            result.ok
              ? "border-isg-ok/30 bg-isg-ok/5"
              : "border-isg-bad/30 bg-isg-bad/5",
          )}
        >
          {result.ok ? (
            <CheckCircle2 size={20} aria-hidden className="mt-0.5 shrink-0 text-isg-ok" />
          ) : (
            <CircleAlert size={20} aria-hidden className="mt-0.5 shrink-0 text-isg-bad" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-extrabold",
                result.ok ? "text-isg-ok" : "text-isg-bad",
              )}
            >
              {result.ok
                ? result.alreadyRecorded
                  ? "Sudah tercatat"
                  : "Kehadiran tercatat"
                : "Gagal mencatat"}
            </p>
            <p className="mt-0.5 text-sm text-isg-ink-soft">{result.message}</p>
            {result.meetingTitle ? (
              <p className="mt-1 text-xs text-isg-muted">{result.meetingTitle}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {cameraError === "INSECURE" ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-card border border-isg-warn/30 bg-isg-warn/5 p-4 text-sm text-isg-ink-soft"
        >
          <CameraOff size={17} aria-hidden className="mt-0.5 shrink-0 text-isg-warn" />
          <div className="flex flex-col gap-2">
            <p className="font-bold text-isg-ink">
              Kamera diblokir karena koneksinya belum aman
            </p>
            <p>
              Browser hanya mengizinkan kamera lewat <strong>https://</strong> atau{" "}
              <strong>localhost</strong>. Halaman ini dibuka lewat alamat jaringan
              biasa, jadi kameranya tidak tersedia sama sekali.
            </p>
            <p className="font-semibold text-isg-ink">
              Cara termudah: pindai QR memakai aplikasi Kamera bawaan HP-mu. Kode QR
              ISG berisi tautan, jadi cukup ketuk tautan yang muncul dan kehadiranmu
              langsung tercatat.
            </p>
          </div>
        </div>
      ) : cameraError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-card border border-isg-warn/30 bg-isg-warn/5 p-4 text-sm text-isg-ink-soft"
        >
          <CameraOff size={17} aria-hidden className="mt-0.5 shrink-0 text-isg-warn" />
          {cameraError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={scanning ? stop : start}
        disabled={submitting}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold text-white shadow-lift transition-colors",
          scanning ? "bg-isg-ink hover:bg-isg-navy" : "bg-isg-blue hover:bg-isg-blue-deep",
          submitting && "cursor-not-allowed opacity-70",
        )}
      >
        <Camera size={17} aria-hidden />
        {scanning ? "Hentikan Pemindaian" : result ? "Pindai Lagi" : "Mulai Pindai QR"}
      </button>

      <p className="text-center text-xs text-isg-muted">
        Bisa juga memindai QR dengan aplikasi Kamera bawaan HP — kode QR ISG berisi
        tautan yang langsung mencatat kehadiranmu.
      </p>
    </div>
  );
}
