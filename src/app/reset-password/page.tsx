import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CircleAlert } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Ganti Kata Sandi",
  description: "Pilih kata sandi baru untuk akun Informatics Study Group.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 flex-col justify-center bg-isg-bg px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-card border border-isg-line bg-isg-surface p-7 shadow-pop sm:p-8">
          <Link href="/" className="mb-6 flex w-fit items-center gap-2">
            <Image src="/LOGOISG.png" alt="" width={30} height={30} aria-hidden />
            <span className="text-sm font-extrabold text-isg-ink">
              Informatics Study Group
            </span>
          </Link>

          {/*
            Token tidak divalidasi di sini. Memeriksanya lebih dulu akan
            memberi tahu penebak apakah sebuah token ada atau tidak; biarkan
            server action yang memutuskan saat kata sandi dikirim.
          */}
          {!token ? (
            <div className="flex flex-col gap-4">
              <span
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-full bg-isg-warn/12 text-isg-warn"
              >
                <CircleAlert size={26} />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-isg-ink">
                  Tautan tidak lengkap
                </h1>
                <p className="mt-2 text-sm text-isg-ink-soft">
                  Halaman ini perlu dibuka lewat tautan dari email. Pastikan kamu
                  menekan tautannya langsung, atau minta tautan baru.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="flex h-12 items-center justify-center rounded-2xl bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
              >
                Minta tautan baru
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
                Pilih kata sandi baru
              </h1>
              <p className="mb-7 mt-2 text-sm text-isg-ink-soft">
                Kata sandi lama langsung tidak berlaku setelah ini disimpan.
              </p>
              <ResetPasswordForm token={token} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
