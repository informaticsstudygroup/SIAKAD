import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — ISG Mini SIAKAD",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen flex-1 grid-cols-1 lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#071A3D] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(17,196,212,0.35), transparent 45%), radial-gradient(circle at 80% 75%, rgba(79,231,175,0.3), transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rotate-12 rounded-[40px] bg-gradient-to-br from-[#0C81E4]/40 via-[#11C4D4]/30 to-[#4FE7AF]/30"
        />

        <span className="relative text-lg font-semibold tracking-tight">ISG</span>

        <div className="relative flex flex-col gap-3">
          <h1 className="max-w-sm text-3xl font-semibold leading-tight">
            Belajar, Berkembang, dan Berkarya Bersama ISG.
          </h1>
          <p className="max-w-sm text-sm text-white/70">
            Masuk untuk melihat jadwal, tugas, kuis, dan progres belajarmu di
            Informatics Study Group.
          </p>
        </div>

        <p className="relative text-xs text-white/50">
          &copy; {new Date().getFullYear()} Informatics Study Group
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-[#F7FAFC] px-6 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-1">
            <span className="text-sm font-semibold text-[#0C81E4] lg:hidden">ISG</span>
            <h2 className="text-2xl font-semibold text-[#102033]">Masuk ke akunmu</h2>
            <p className="text-sm text-[#64748B]">
              Gunakan email dan kata sandi yang terdaftar di ISG.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
