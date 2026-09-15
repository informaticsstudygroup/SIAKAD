"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type LoginFormState } from "@/features/auth/actions/login";
import { cn } from "@/utils/cn";

const initialState: LoginFormState = {};

// Label disembunyikan secara visual tapi tetap ada untuk pembaca layar —
// tampilannya bersih tanpa mengorbankan aksesibilitas.
const fieldClass =
  "h-13 w-full rounded-2xl border border-isg-line bg-white px-4 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/80 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="identifier" className="sr-only">
        Email atau NIM
      </label>
      <input
        id="identifier"
        name="identifier"
        type="text"
        required
        autoComplete="username"
        placeholder="Email atau NIM"
        className={fieldClass}
      />

      <label htmlFor="password" className="sr-only">
        Kata sandi
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Kata sandi"
          className={cn(fieldClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-isg-muted transition-colors hover:text-isg-ink"
        >
          {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs font-bold text-isg-blue hover:underline"
        >
          Lupa kata sandi?
        </Link>
      </div>

      {state.error ? (
        <p
          role="alert"
          data-testid="login-error"
          className="flex items-start gap-2.5 rounded-2xl border border-isg-bad/25 bg-isg-bad/5 px-4 py-3 text-sm text-isg-bad"
        >
          <CircleAlert size={17} aria-hidden className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "mt-1 flex h-13 items-center justify-center gap-2 rounded-2xl bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? (
          <>
            <Loader2 size={17} aria-hidden className="animate-spin" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </button>

      <p className="mt-1 text-center text-sm text-isg-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-isg-blue hover:underline">
          Daftar ISG
        </Link>
      </p>
    </form>
  );
}
