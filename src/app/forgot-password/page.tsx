import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Cara memulihkan akses akun Informatics Study Group SIAKAD.",
};

const STEPS = [
  "Kirim email ke halo@isg.dev dari alamat email yang kamu daftarkan.",
  "Sertakan nama lengkap dan NIM-mu supaya Admin bisa mencocokkan data.",
  "Admin akan mengirimkan kata sandi sementara, dan kamu bisa menggantinya setelah masuk.",
];

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
            <Image
              src="/LOGOISG.png"
              alt=""
              width={30}
              height={30}
              aria-hidden
            />
            <span className="font-display text-sm font-extrabold text-isg-ink">
              Informatics Study Group SIAKAD
            </span>
          </Link>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-isg-ink">
            Lupa kata sandi?
          </h1>
          <p className="mt-2 text-sm text-isg-ink-soft">
            Pemulihan kata sandi di ISG masih dibantu langsung oleh Admin, jadi
            belum ada email otomatis. Ikuti tiga langkah berikut.
          </p>

          <ol className="mt-6 flex flex-col gap-4">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-isg-blue/10 font-display text-sm font-extrabold text-isg-blue"
                >
                  {index + 1}
                </span>
                <span className="text-sm text-isg-ink-soft">{step}</span>
              </li>
            ))}
          </ol>

          <a
            href="mailto:halo@isg.dev?subject=Lupa%20Kata%20Sandi%20ISG%20Mini%20SIAKAD"
            className="mt-7 flex h-12 items-center justify-center gap-2 rounded-2xl bg-isg-blue text-sm font-extrabold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
          >
            <Mail size={17} aria-hidden />
            Email Admin Informatics Study Group
          </a>

          <p className="mt-5 text-center text-sm text-isg-muted">
            Sudah ingat kata sandimu?{" "}
            <Link
              href="/login"
              className="font-bold text-isg-blue hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
