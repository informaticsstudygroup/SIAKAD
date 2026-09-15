import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Particles from "@/components/reactbits/Particles";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Informatics Study Group SIAKAD untuk melihat jadwal, tugas, kuis, dan progres belajarmu.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-white">
      {/* Gradasi lembut, tetap terang — bukan panel gelap seperti versi lama */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 700px at 12% 78%, rgba(17,196,212,0.20), transparent 62%), radial-gradient(900px 600px at 85% 12%, rgba(12,129,228,0.16), transparent 60%), radial-gradient(700px 500px at 60% 100%, rgba(79,231,175,0.18), transparent 60%)",
        }}
      />

      <Particles
        particleColors={["#0c81e4", "#11c4d4", "#4fe7af"]}
        particleCount={160}
        particleSpread={10}
        speed={0.12}
        particleBaseSize={80}
        moveParticlesOnHover
        alphaParticles
        disableRotation={false}
        pixelRatio={2}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 lg:px-10">
        <Link href="/" className="flex w-fit items-center gap-3 rounded-full">
          <Image src="/LOGOISG.png" alt="" width={500} height={500} aria-hidden className="h-10 w-10" />
          <span className="text-base font-extrabold tracking-tight text-isg-ink">
            Informatics Study Group
          </span>
        </Link>

        <div className="grid flex-1 grid-cols-1 items-center gap-12 py-10 lg:grid-cols-2 lg:gap-16">
          {/* Sisi brand — wordmark tampil besar, di sini ruangnya cukup */}
          <div className="hidden flex-col gap-6 lg:flex">
            <Image
              src="/isText.png"
              alt="Informatics Study Group"
              width={1593}
              height={805}
              priority
              className="h-auto w-full max-w-md"
            />
            <p className="max-w-sm text-lg text-isg-ink-soft">
              Lanjutkan progres belajarmu — jadwal, tugas, kuis, dan sertifikat dalam satu
              tempat.
            </p>
          </div>

          {/* Kartu form */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-pop backdrop-blur-xl sm:p-9">
              <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
                Masuk ke akunmu
              </h1>
              <p className="mt-1.5 text-sm text-isg-muted">
                Gunakan email atau NIM yang terdaftar.
              </p>

              <div className="mt-7">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-isg-muted">
          &copy; {new Date().getFullYear()} Informatics Study Group
        </p>
      </div>
    </main>
  );
}
