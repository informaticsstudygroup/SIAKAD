"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlert, MailCheck, Send } from "lucide-react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/features/auth/actions/password-reset";
import { cn } from "@/utils/cn";

const initialState: ResetRequestState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-isg-ok/12 text-isg-ok"
        >
          <MailCheck size={26} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-isg-ink">Tautan sudah dikirim</h2>
          <p className="mt-1.5 text-sm text-isg-ink-soft">
            Kalau akun dengan data itu terdaftar dan sudah aktif, tautan penggantian
            kata sandi sudah masuk ke emailnya. Tautannya berlaku satu jam.
          </p>
        </div>
        <p className="rounded-card bg-isg-tint px-4 py-3 text-sm text-isg-ink-soft">
          Tidak menemukan emailnya? Cek folder <strong>Spam</strong>, lalu cari{" "}
          <span className="font-mono text-xs">in:anywhere ISG</span> di Gmail.
        </p>
        <Link
          href="/login"
          className="text-sm font-bold text-isg-blue hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-bold text-isg-ink">
          Email atau NIM
        </label>
        <input
          id="identifier"
          name="identifier"
          required
          autoComplete="username"
          placeholder="nama@unikadelasalle.ac.id atau 2211523001"
          className="h-12 w-full rounded-2xl border border-isg-line bg-isg-surface px-4 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
        />
        <p className="text-xs text-isg-muted">
          Peserta bisa memakai NIM. Staf memakai email.
        </p>
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
        disabled={isPending}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-2xl bg-isg-blue text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? (
          "Mengirim..."
        ) : (
          <>
            <Send size={16} aria-hidden />
            Kirim Tautan Penggantian
          </>
        )}
      </button>

      <p className="text-center text-sm text-isg-muted">
        Sudah ingat kata sandimu?{" "}
        <Link href="/login" className="font-bold text-isg-blue hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
