"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type LoginFormState } from "@/features/auth/actions/login";
import { cn } from "@/utils/cn";

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium text-[#102033]">
          Email atau NIM
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="nama@email.com atau NIM"
          className="h-11 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#102033] outline-none transition-colors focus:border-[#0C81E4] focus:ring-2 focus:ring-[#0C81E4]/20"
        />
        <p className="text-xs text-[#64748B]">
          Peserta masuk dengan NIM, Admin/Mentor/Advisor masuk dengan email.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-[#102033]">
            Kata Sandi
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[#0C81E4] hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 pr-11 text-sm text-[#102033] outline-none transition-colors focus:border-[#0C81E4] focus:ring-2 focus:ring-[#0C81E4]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#64748B] hover:text-[#102033]"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          data-testid="login-error"
          className="rounded-xl border border-[#E5484D]/30 bg-[#E5484D]/5 px-4 py-2.5 text-sm text-[#E5484D]"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "h-11 rounded-xl bg-[#0C81E4] text-sm font-semibold text-white transition-colors hover:bg-[#0a6fc7]",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-center text-sm text-[#64748B]">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-[#0C81E4] hover:underline">
          Daftar ISG
        </Link>
      </p>
    </form>
  );
}
