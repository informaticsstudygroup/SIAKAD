"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  createStaffAccount,
  resetAccountPassword,
  updateStaffAccount,
  type AccountFormState,
} from "@/features/accounts/actions/account-actions";
import { ROLE_LABEL, STAFF_ROLES, type AccountRow } from "@/features/accounts/types";
import { cn } from "@/utils/cn";

const initialState: AccountFormState = {};

const inputClass =
  "h-11 w-full rounded-xl border border-isg-line bg-isg-surface px-3.5 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15";

export function AccountFormDrawer({
  account,
  onClose,
}: {
  /** null berarti membuat akun baru. */
  account: AccountRow | null;
  onClose: () => void;
}) {
  const isEdit = account !== null;
  const isParticipant = account?.role === "PARTICIPANT";

  const [state, formAction, isPending] = useActionState(
    isEdit ? updateStaffAccount : createStaffAccount,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Drawer
      title={isEdit ? "Ubah Akun" : "Tambah Akun Staf"}
      description={
        isEdit
          ? account.email
          : "Akun staf langsung aktif tanpa perlu verifikasi."
      }
      onClose={onClose}
    >
      <div className="flex flex-1 flex-col gap-6">
        {isParticipant ? (
          <p className="rounded-xl border border-isg-warn/30 bg-isg-warn/5 px-4 py-3 text-sm text-isg-ink-soft">
            Ini akun peserta. Data pribadinya terikat pendaftaran dan angkatan,
            jadi hanya kata sandi serta status aktifnya yang bisa diubah di sini.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            {isEdit ? <input type="hidden" name="id" value={account.id} /> : null}

            <Field label="Nama Lengkap" htmlFor="acc-name">
              <input
                id="acc-name"
                name="name"
                required
                defaultValue={account?.name ?? ""}
                placeholder="Nama staf"
                className={inputClass}
              />
            </Field>

            {!isEdit ? (
              <Field label="Email" htmlFor="acc-email">
                <input
                  id="acc-email"
                  name="email"
                  type="email"
                  required
                  placeholder="nama@isg.dev"
                  className={inputClass}
                />
              </Field>
            ) : null}

            <Field label="Peran" htmlFor="acc-role">
              <select
                id="acc-role"
                name="role"
                required
                defaultValue={account?.role ?? "MENTOR"}
                className={inputClass}
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jabatan" htmlFor="acc-position" optional>
              <input
                id="acc-position"
                name="position"
                defaultValue={account?.position ?? ""}
                placeholder="Contoh: Koordinator Kelas Web"
                className={inputClass}
              />
            </Field>

            <Field label="Nomor Telepon" htmlFor="acc-phone" optional>
              <input
                id="acc-phone"
                name="phone"
                type="tel"
                defaultValue={account?.phone ?? ""}
                placeholder="081234567890"
                className={inputClass}
              />
            </Field>

            {!isEdit ? (
              <Field label="Kata Sandi Awal" htmlFor="acc-password">
                <div className="relative">
                  <input
                    id="acc-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className={cn(inputClass, "pr-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-isg-muted hover:text-isg-ink"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
            ) : null}

            {state.error ? <ErrorNote message={state.error} /> : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-isg-line px-4 py-2.5 text-sm font-bold text-isg-ink hover:bg-isg-tint"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  "rounded-xl bg-isg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-isg-blue-deep",
                  isPending && "cursor-not-allowed opacity-70",
                )}
              >
                {isPending ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Akun"}
              </button>
            </div>
          </form>
        )}

        {isEdit ? <ResetPasswordForm account={account} /> : null}
      </div>
    </Drawer>
  );
}

function ResetPasswordForm({ account }: { account: AccountRow }) {
  const [state, formAction, isPending] = useActionState(
    resetAccountPassword,
    initialState,
  );
  // Diturunkan dari state action, bukan disalin lewat useEffect: menyalinnya
  // memicu render berantai dan ditolak aturan React Compiler.
  const [dirty, setDirty] = useState(false);
  const done = Boolean(state.success) && !dirty;

  return (
    <form
      action={formAction}
      onSubmit={() => setDirty(false)}
      className="flex flex-col gap-3 border-t border-isg-line pt-5"
    >
      <input type="hidden" name="id" value={account.id} />
      <h3 className="text-sm font-extrabold text-isg-ink">Setel Ulang Kata Sandi</h3>
      <p className="text-xs text-isg-muted">
        Kata sandi lama akan langsung diganti. Sampaikan yang baru ke pemilik akun.
      </p>

      <input
        name="password"
        type="text"
        required
        minLength={8}
        placeholder="Kata sandi baru, minimal 8 karakter"
        className={inputClass}
        onChange={() => setDirty(true)}
      />

      {state.error ? <ErrorNote message={state.error} /> : null}
      {done ? (
        <p className="text-sm font-bold text-isg-ok">Kata sandi berhasil diganti.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-fit rounded-xl border border-isg-line px-4 py-2.5 text-sm font-bold text-isg-ink hover:bg-isg-tint",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        {isPending ? "Menyimpan..." : "Ganti Kata Sandi"}
      </button>
    </form>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-isg-bad/25 bg-isg-bad/5 px-3.5 py-2.5 text-sm text-isg-bad"
    >
      <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      {message}
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
