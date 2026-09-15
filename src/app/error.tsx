"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCw, TriangleAlert } from "lucide-react";

/**
 * Batas error untuk seluruh aplikasi. Tanpa berkas ini, kegagalan apa pun di
 * server component — terutama database yang tidak bisa dihubungi — muncul
 * sebagai halaman error mentah Next.js.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] error tidak tertangani:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-isg-bg px-6 py-12">
      <div className="w-full max-w-md rounded-xl2 border border-isg-line bg-isg-surface p-8 text-center shadow-pop">
        <span
          aria-hidden
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-isg-warn/12 text-isg-warn"
        >
          <TriangleAlert size={26} />
        </span>

        <h1 className="text-xl font-extrabold tracking-tight text-isg-ink">
          Ada yang bermasalah di sisi kami
        </h1>
        <p className="mt-2 text-sm text-isg-ink-soft">
          Halaman ini gagal dimuat. Biasanya karena server sedang tidak bisa
          menghubungi database. Coba muat ulang sebentar lagi.
        </p>

        {error.digest ? (
          <p className="mt-4 rounded-card bg-isg-tint px-3 py-2 font-mono text-xs text-isg-muted">
            Kode: {error.digest}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-full bg-isg-blue px-6 py-3 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
          >
            <RotateCw size={16} aria-hidden />
            Coba lagi
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-full border border-isg-line px-6 py-3 text-sm font-bold text-isg-ink transition-colors hover:bg-isg-tint"
          >
            <ArrowLeft size={16} aria-hidden />
            Ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
