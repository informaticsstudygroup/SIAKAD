"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";
import {
  changeMyPassword,
  updateMyProfile,
  type ProfileFormState,
} from "@/features/profile/actions/profile-actions";
import { PhotoPicker } from "@/features/registration/components/PhotoPicker";
import { cn } from "@/utils/cn";

const initialState: ProfileFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; phone: string; bio: string; photoUrl: string };
}) {
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [state, formAction, isPending] = useActionState(updateMyProfile, initialState);
  const [dirty, setDirty] = useState(false);
  const saved = Boolean(state.success) && !dirty;

  return (
    <form
      action={formAction}
      onSubmit={() => setDirty(false)}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:p-6"
    >
      <h2 className="text-base font-extrabold text-isg-ink">Data Diri</h2>

      <input type="hidden" name="photoUrl" value={photoUrl} />
      <PhotoPicker
        value={photoUrl}
        onChange={(v) => {
          setPhotoUrl(v);
          setDirty(true);
        }}
      />

      <Field label="Nama Lengkap" htmlFor="p-name">
        <input
          id="p-name"
          name="name"
          required
          defaultValue={initial.name}
          className={inputClass}
        />
      </Field>

      <Field label="Nomor Telepon" htmlFor="p-phone" optional>
        <input
          id="p-phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          placeholder="081234567890"
          className={inputClass}
        />
      </Field>

      <Field label="Bio" htmlFor="p-bio" optional>
        <textarea
          id="p-bio"
          name="bio"
          rows={3}
          defaultValue={initial.bio}
          placeholder="Ceritakan sedikit tentang dirimu..."
          className={cn(inputClass, "h-auto py-3")}
        />
      </Field>

      {state.error ? <Note kind="error" text={state.error} /> : null}
      {saved ? <Note kind="ok" text="Profil tersimpan." /> : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-fit rounded-full bg-isg-blue px-6 py-3 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}

export function PasswordForm({ redirectTo }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changeMyPassword, initialState);
  const [dirty, setDirty] = useState(false);
  const saved = Boolean(state.success) && !dirty;

  useEffect(() => {
    if (state.success && redirectTo) router.replace(redirectTo);
  }, [redirectTo, router, state.success]);

  return (
    <form
      action={formAction}
      onSubmit={() => setDirty(false)}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:p-6"
    >
      <div>
        <h2 className="text-base font-extrabold text-isg-ink">Ganti Kata Sandi</h2>
        <p className="mt-1 text-sm text-isg-muted">
          Kamu perlu memasukkan kata sandi saat ini untuk menggantinya.
        </p>
      </div>

      <Field label="Kata Sandi Saat Ini" htmlFor="p-current">
        <input
          id="p-current"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>

      <Field label="Kata Sandi Baru" htmlFor="p-new">
        <input
          id="p-new"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      <Field label="Ulangi Kata Sandi Baru" htmlFor="p-confirm">
        <input
          id="p-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      {state.error ? <Note kind="error" text={state.error} /> : null}
      {saved ? <Note kind="ok" text="Kata sandi berhasil diganti." /> : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-fit rounded-full border border-isg-line px-6 py-3 text-sm font-bold text-isg-ink transition-colors hover:bg-isg-tint",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? "Menyimpan..." : "Ganti Kata Sandi"}
      </button>
    </form>
  );
}

function Note({ kind, text }: { kind: "error" | "ok"; text: string }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm",
        kind === "error"
          ? "border-isg-bad/25 bg-isg-bad/5 text-isg-bad"
          : "border-isg-ok/25 bg-isg-ok/5 text-isg-ok",
      )}
    >
      {kind === "error" ? (
        <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0" />
      )}
      {text}
    </p>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-isg-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-medium text-isg-muted">(opsional)</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
