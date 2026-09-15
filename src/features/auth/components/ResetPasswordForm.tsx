"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  confirmPasswordReset,
  type ResetConfirmState,
} from "@/features/auth/actions/password-reset";
import {
  PasswordMeter,
  scorePassword,
} from "@/features/registration/components/PasswordMeter";
import { cn } from "@/utils/cn";

const initialState: ResetConfirmState = {};

const fieldClass =
  "h-12 w-full rounded-2xl border border-isg-line bg-isg-surface px-4 pr-12 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmPasswordReset,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  if (state.done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-isg-ok/12 text-isg-ok"
        >
          <ShieldCheck size={26} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-isg-ink">Kata sandi diganti</h2>
          <p className="mt-1.5 text-sm text-isg-ink-soft">
            Kata sandimu sudah diperbarui. Tautan tadi otomatis hangus dan tidak bisa
            dipakai lagi.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
        >
          Masuk sekarang
        </Link>
      </div>
    );
  }

  // Sengaja tidak memakai skor di sisi server: aturan kuat-lemah ada di klien,
  // server hanya menuntut minimal 8 karakter.
  const tooWeak = scorePassword(password) < 3;
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-isg-ink">
          Kata Sandi Baru
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Buat kata sandi yang kuat"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-isg-muted transition-colors hover:text-isg-ink"
          >
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>

      <PasswordMeter value={password} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-isg-ink">
          Ulangi Kata Sandi Baru
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Ketik ulang kata sandi barumu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldClass}
          />
          {confirm && confirm === password ? (
            <span className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-isg-ok">
              <Check size={18} strokeWidth={3} aria-hidden />
              <span className="sr-only">Kata sandi cocok</span>
            </span>
          ) : null}
        </div>
        {mismatch ? (
          <p className="text-xs font-semibold text-isg-bad">
            Konfirmasi kata sandi belum sama.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-isg-bad/25 bg-isg-bad/5 px-4 py-3 text-sm text-isg-bad"
        >
          <CircleAlert size={17} aria-hidden className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || tooWeak || mismatch || !confirm}
        className={cn(
          "flex h-12 items-center justify-center rounded-2xl bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
          (isPending || tooWeak || mismatch || !confirm) &&
            "cursor-not-allowed opacity-60",
        )}
      >
        {isPending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
      </button>

      {state.error ? (
        <Link
          href="/forgot-password"
          className="text-center text-sm font-bold text-isg-blue hover:underline"
        >
          Minta tautan baru
        </Link>
      ) : null}
    </form>
  );
}
