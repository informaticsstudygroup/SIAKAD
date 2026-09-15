import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { RegistrationWizard } from "@/features/registration/components/RegistrationWizard";

export const metadata: Metadata = {
  title: "Daftar Peserta",
  description:
    "Daftar sebagai peserta Informatics Study Group. Isi data diri, buat akun, lalu tunggu verifikasi Admin.",
};

/**
 * Halaman ini sengaja berada di luar route group (public) supaya tidak ikut
 * mendapat navbar dan footer — alur pendaftaran perlu fokus, cukup tombol
 * kembali di kiri atas.
 */
export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-isg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 -ml-3 text-sm font-bold text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            Kembali
          </Link>

          <Link href="/" aria-label="Beranda Informatics Study Group SIAKAD">
            <Image
              src="/LOGOISG.png"
              alt=""
              width={34}
              height={34}
              aria-hidden
            />
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink sm:text-3xl">
            Daftar jadi peserta Informatics Study Group
          </h1>
          <p className="mt-2 text-base text-isg-ink-soft">
            Tiga langkah singkat. Akunmu aktif setelah diverifikasi Admin.
          </p>
        </div>

        <RegistrationWizard />
      </div>
    </main>
  );
}
