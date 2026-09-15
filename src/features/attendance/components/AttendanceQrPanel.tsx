"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CircleAlert, Play, RefreshCw, Square, Users } from "lucide-react";
import { setAttendanceManually } from "@/features/attendance/actions/attendance-actions";
import {
  getAttendanceSnapshot,
  type AttendanceSnapshot,
  type RosterEntry,
} from "@/features/attendance/actions/session-actions";
import { setAttendanceOpen } from "@/features/schedule/actions/meeting-actions";
import { ROTATE_SECONDS } from "@/features/attendance/qr-token";
import { cn } from "@/utils/cn";

/**
 * Panel yang ditayangkan mentor di proyektor. QR berganti tiap ROTATE_SECONDS
 * detik, dan daftar hadir ikut diperbarui pada tiap rotasi.
 */
export function AttendanceQrPanel({
  meetingId,
  meetingTitle,
  initialOpen,
  totalParticipants,
}: {
  meetingId: string;
  meetingTitle: string;
  initialOpen: boolean;
  totalParticipants: number;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [snapshot, setSnapshot] = useState<AttendanceSnapshot>({});
  const [qrImage, setQrImage] = useState("");
  const [countdown, setCountdown] = useState(ROTATE_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<string | null>(null);
  // QR memuat alamat halaman ini. Kalau mentor membukanya lewat localhost,
  // tautan di dalam QR menunjuk ke localhost milik HP peserta — yang tidak
  // ada. Kondisi itu perlu diberitahukan, bukan dibiarkan gagal diam-diam.
  const [localhostQr, setLocalhostQr] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const next = await getAttendanceSnapshot(meetingId);
    setSnapshot(next);
    if (next.error) {
      setError(next.error);
      return;
    }
    setError("");
    setOpen(Boolean(next.open));
    setCountdown(next.secondsLeft ?? ROTATE_SECONDS);

    if (next.token) {
      // QR memuat URL penuh supaya kamera bawaan HP pun bisa membukanya,
      // bukan cuma pemindai di dalam aplikasi.
      const origin = window.location.origin;
      setLocalhostQr(/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(origin));
      const url = `${origin}/dashboard/presensi/scan?t=${encodeURIComponent(next.token)}`;
      setQrImage(
        await QRCode.toDataURL(url, {
          width: 720,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#0f1729", light: "#ffffff" },
        }),
      );
    } else {
      setQrImage("");
    }
  }, [meetingId]);

  useEffect(() => {
    // Mengambil token dan daftar hadir pertama kali. Ini justru pemakaian
    // effect yang dimaksudkan aturan tersebut: menyinkronkan dengan sistem
    // eksternal (server), bukan menyalin state React ke state React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Hitung mundur per detik; saat mencapai nol, ambil token baru.
  useEffect(() => {
    if (!open) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void refresh();
          return ROTATE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, refresh]);

  async function toggle() {
    setBusy(true);
    setError("");
    const result = await setAttendanceOpen(meetingId, !open);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  const roster = snapshot.roster ?? [];
  const hadir = roster.filter((r) => r.status === "HADIR").length;
  const total = roster.length || totalParticipants;
  const progress = total > 0 ? (hadir / total) * 100 : 0;

  async function tandai(participantId: string, status: RosterEntry["status"]) {
    if (!status) return;
    setMarking(participantId);
    const result = await setAttendanceManually({ meetingId, participantId, status });
    setMarking(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ---------- QR ---------- */}
      <div className="flex flex-col items-center gap-5 rounded-card border border-isg-line bg-isg-surface p-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-isg-ink">
            {meetingTitle}
          </h2>
          <p className="mt-1 text-sm text-isg-muted">
            {open
              ? "Peserta memindai kode ini untuk mencatat kehadiran."
              : "Sesi presensi sedang ditutup."}
          </p>
        </div>

        <div className="relative flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-isg-line bg-white">
          {open && qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL yang dibuat di klien
            <img
              src={qrImage}
              alt="Kode QR presensi"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-isg-muted">
              <Square size={38} aria-hidden />
              <p className="text-sm font-semibold">
                Tekan &ldquo;Buka Presensi&rdquo; untuk menampilkan QR
              </p>
            </div>
          )}
        </div>

        {open && localhostQr ? (
          <div
            role="alert"
            className="w-full max-w-sm rounded-card border border-isg-warn/30 bg-isg-warn/5 p-3.5 text-left text-xs text-isg-ink-soft"
          >
            <p className="font-bold text-isg-ink">QR ini belum bisa dipindai HP</p>
            <p className="mt-1">
              Kamu membuka halaman lewat <strong>localhost</strong>, jadi tautan di
              dalam QR menunjuk ke HP peserta sendiri. Buka aplikasi lewat alamat
              jaringan komputermu (misalnya <strong>http://192.168.x.x:3000</strong>)
              supaya QR-nya bisa dibuka peserta.
            </p>
          </div>
        ) : null}

        {open ? (
          <div className="flex w-full max-w-sm items-center gap-3">
            <RefreshCw
              size={15}
              aria-hidden
              className="shrink-0 text-isg-muted motion-safe:animate-spin [animation-duration:3s]"
            />
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-isg-line"
              role="progressbar"
              aria-valuenow={countdown}
              aria-valuemin={0}
              aria-valuemax={ROTATE_SECONDS}
              aria-label="Sisa waktu sebelum kode berganti"
            >
              <div
                className="h-full rounded-full bg-isg-blue transition-[width] duration-1000 ease-linear"
                style={{ width: `${(countdown / ROTATE_SECONDS) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-left font-mono text-xs text-isg-muted">
              {countdown}s
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            "flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lift transition-colors",
            open ? "bg-isg-bad hover:bg-[#c93b40]" : "bg-isg-blue hover:bg-isg-blue-deep",
            busy && "cursor-not-allowed opacity-70",
          )}
        >
          {open ? <Square size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          {busy ? "Memproses..." : open ? "Tutup Presensi" : "Buka Presensi"}
        </button>

        {error ? (
          <p
            role="alert"
            className="flex items-center gap-2 text-sm font-semibold text-isg-bad"
          >
            <CircleAlert size={15} aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      {/* ---------- Daftar hadir + koreksi manual ---------- */}
      <div className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-isg-ink">
            <Users size={16} aria-hidden />
            Daftar Hadir
          </h3>
          <span className="font-mono text-sm font-bold tabular-nums text-isg-ink">
            {hadir}/{total}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-isg-line">
          <div
            className="h-full rounded-full bg-isg-ok transition-[width] duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        <p className="text-xs text-isg-muted">
          Peserta tercatat otomatis saat memindai QR. Tandai manual untuk yang izin,
          tidak hadir, atau lupa membawa HP.
        </p>

        {roster.length === 0 ? (
          <p className="py-8 text-center text-sm text-isg-muted">
            Belum ada peserta terdaftar di angkatan ini.
          </p>
        ) : (
          <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {roster.map((row) => (
              <li
                key={row.participantId}
                className="flex flex-col gap-2 rounded-xl bg-isg-tint p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-isg-ink">
                    {row.name}
                  </span>
                  {row.at ? (
                    <span className="shrink-0 font-mono text-xs text-isg-muted">
                      {new Date(row.at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-isg-muted">{row.studentId}</span>

                <div className="flex gap-1.5">
                  {(
                    [
                      ["HADIR", "Hadir", "bg-isg-ok"],
                      ["IZIN", "Izin", "bg-isg-warn"],
                      ["TIDAK_HADIR", "Alpa", "bg-isg-bad"],
                    ] as const
                  ).map(([status, label, warna]) => {
                    const aktif = row.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={marking === row.participantId}
                        onClick={() => tandai(row.participantId, status)}
                        aria-pressed={aktif}
                        className={cn(
                          "flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors",
                          aktif
                            ? `${warna} text-white`
                            : "bg-isg-surface text-isg-muted hover:text-isg-ink",
                          marking === row.participantId && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
