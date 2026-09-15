import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Magnet } from "@/components/reactbits/Magnet";

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-28">
      <div className="relative isolate overflow-hidden rounded-xl2 bg-isg-navy px-6 py-16 text-center sm:px-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-isg-blue/35 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-12 h-64 w-64 rounded-full bg-isg-mint/25 blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-5">
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Siap mulai dari langkah pertama?
          </h2>
          <p className="max-w-md text-base text-white/70">
            Pendaftaran cuma butuh beberapa menit. Setelah diverifikasi Admin, kamu
            langsung masuk angkatan dan bisa memantau progres belajarmu sendiri.
          </p>

          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Magnet className="w-full sm:w-auto">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 rounded-full bg-white py-2.5 pl-6 pr-2.5 text-sm font-bold text-isg-navy transition-colors hover:bg-isg-mint"
              >
                Daftar Sebagai Peserta
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-isg-navy text-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight size={17} strokeWidth={2.6} aria-hidden />
                </span>
              </Link>
            </Magnet>
            <Link
              href="/login"
              className="flex items-center justify-center rounded-full border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Sudah punya akun
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
