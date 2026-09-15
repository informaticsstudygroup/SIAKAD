import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Minta tautan penggantian kata sandi akun Informatics Study Group.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col justify-center bg-isg-bg px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-isg-muted transition-colors hover:text-isg-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          Kembali ke halaman masuk
        </Link>

        <div className="rounded-card border border-isg-line bg-isg-surface p-7 shadow-pop sm:p-8">
          <Link href="/" className="mb-6 flex w-fit items-center gap-2">
            <Image src="/LOGOISG.png" alt="" width={30} height={30} aria-hidden />
            <span className="text-sm font-extrabold text-isg-ink">
              Informatics Study Group
            </span>
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
            Lupa kata sandi?
          </h1>
          <p className="mb-7 mt-2 text-sm text-isg-ink-soft">
            Masukkan email atau NIM-mu. Kami kirimkan tautan untuk memilih kata sandi
            baru — tanpa perlu menunggu Admin.
          </p>

          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
