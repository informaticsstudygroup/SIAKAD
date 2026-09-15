"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import Stepper, { Step } from "@/components/reactbits/Stepper";
import {
  registerAction,
  type RegisterFormState,
} from "@/features/registration/actions/register-action";
import { CAMPUS_EMAIL_DOMAIN, REASON_MIN } from "@/features/registration/constants";
import { PhotoPicker } from "@/features/registration/components/PhotoPicker";
import { cn } from "@/utils/cn";

const initialState: RegisterFormState = {};
const STEP_LABELS = ["Data Diri", "Konfirmasi"];

type Values = {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  semester: string;
  reason: string;
  techInterests: string;
};

const EMPTY: Values = {
  name: "",
  studentId: "",
  email: "",
  phone: "",
  semester: "1",
  reason: "",
  techInterests: "",
};

const STEP_FIELDS: Record<number, (keyof Values)[]> = {
  1: ["name", "studentId", "email", "phone", "reason"],
  2: [],
};

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};

  if (values.name.trim().length < 3) errors.name = "Nama lengkap minimal 3 huruf.";
  if (!/^\d{6,15}$/.test(values.studentId.trim()))
    errors.studentId = "NIM hanya berisi angka, 6 sampai 15 digit.";
  if (!values.email.trim()) {
    errors.email = "Email kampus wajib diisi.";
  } else if (!values.email.trim().toLowerCase().endsWith(CAMPUS_EMAIL_DOMAIN)) {
    errors.email = `Wajib email kampus, berakhiran ${CAMPUS_EMAIL_DOMAIN}.`;
  }
  if (!/^[\d+\s-]{9,16}$/.test(values.phone.trim()))
    errors.phone = "Nomor telepon 9 sampai 16 digit.";
  if (values.reason.trim().length < REASON_MIN)
    errors.reason = `Ceritakan minimal ${REASON_MIN} karakter.`;
  return errors;
}

export function RegistrationWizard() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const errors = validate(values);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function markTouched(key: keyof Values) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function validateStep(step: number) {
    const fields = STEP_FIELDS[step] ?? [];
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((f) => (next[f] = true));
      return next;
    });
    return !fields.some((field) => errors[field]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!agreed) {
      event.preventDefault();
      setAgreeError(true);
    }
  }

  const showError = (key: keyof Values) => (touched[key] ? errors[key] : undefined);
  const interestList = values.techInterests
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {/*
        Stepper hanya me-render langkah aktif, jadi input langkah lain lepas dari
        DOM dan tidak ikut terkirim. Nilainya dikirim lewat hidden input berikut;
        input yang terlihat sengaja tanpa atribut name agar tidak dobel.
      */}
      <input type="hidden" name="name" value={values.name} />
      <input type="hidden" name="studentId" value={values.studentId} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="phone" value={values.phone} />
      <input type="hidden" name="semester" value={values.semester} />
      <input type="hidden" name="photoUrl" value={photoUrl} />
      <input type="hidden" name="reason" value={values.reason} />
      <input type="hidden" name="techInterests" value={values.techInterests} />
      {agreed ? <input type="hidden" name="agreement" value="on" /> : null}

      <Stepper
        initialStep={1}
        stepLabels={STEP_LABELS}
        validateStep={validateStep}
        submitOnFinal
        isSubmitting={isPending}
        backButtonText="Kembali"
        nextButtonText="Lanjut"
        completeButtonText="Daftar Sekarang"
      >
        {/* ---------- Langkah 1 ---------- */}
        <Step>
          <Panel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" htmlFor="name" error={showError("name")}>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Nama sesuai data kampus"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => markTouched("name")}
                  className={inputClass(!!showError("name"))}
                />
              </Field>

              <Field label="NIM" htmlFor="studentId" error={showError("studentId")}>
                <input
                  id="studentId"
                  inputMode="numeric"
                  placeholder="2211523001"
                  value={values.studentId}
                  onChange={(e) => set("studentId", e.target.value.replace(/\D/g, ""))}
                  onBlur={() => markTouched("studentId")}
                  className={inputClass(!!showError("studentId"))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Email Kampus"
                htmlFor="email"
                error={showError("email")}
                hint={`Wajib berakhiran ${CAMPUS_EMAIL_DOMAIN}`}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={`nama${CAMPUS_EMAIL_DOMAIN}`}
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  className={inputClass(!!showError("email"))}
                />
              </Field>

              <Field label="Nomor Telepon" htmlFor="phone" error={showError("phone")}>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="081234567890"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => markTouched("phone")}
                  className={inputClass(!!showError("phone"))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Semester" htmlFor="semester">
                <select
                  id="semester"
                  value={values.semester}
                  onChange={(e) => set("semester", e.target.value)}
                  className={inputClass(false)}
                >
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Minat Teknologi"
                htmlFor="techInterests"
                optional
                hint="Tulis bebas, pisahkan dengan koma."
              >
                <input
                  id="techInterests"
                  placeholder="Web Development, Machine Learning"
                  value={values.techInterests}
                  onChange={(e) => set("techInterests", e.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            </div>

            <Field
              label="Alasan Bergabung"
              htmlFor="reason"
              error={showError("reason")}
              hint={`${values.reason.trim().length}/${REASON_MIN} karakter minimum`}
            >
              <textarea
                id="reason"
                rows={3}
                placeholder="Ceritakan singkat kenapa kamu ingin gabung ISG dan apa yang ingin kamu pelajari."
                value={values.reason}
                onChange={(e) => set("reason", e.target.value)}
                onBlur={() => markTouched("reason")}
                className={cn(inputClass(!!showError("reason")), "h-auto py-3")}
              />
            </Field>
          </Panel>
        </Step>

        {/* ---------- Langkah 2 ---------- */}
        <Step>
          <div className="flex flex-col gap-4">
            {/* Foto sengaja diletakkan di langkah terakhir: ini satu-satunya isian
                opsional dan yang paling berat interaksinya (membuka file picker).
                Menaruhnya di layar pertama menambah gesekan sebelum pendaftar
                sempat mengisi apa pun. */}
            <Panel>
              <PhotoPicker value={photoUrl} onChange={setPhotoUrl} />

              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-isg-line pt-4 sm:grid-cols-2">
                <Row label="Nama" value={values.name} />
                <Row label="NIM" value={values.studentId} />
                <Row label="Email kampus" value={values.email} />
                <Row label="Telepon" value={values.phone} />
                <Row label="Semester" value={`Semester ${values.semester}`} />
                <Row
                  label="Minat teknologi"
                  value={interestList.length ? interestList.join(", ") : "Tidak diisi"}
                />
                <Row label="Alasan bergabung" value={values.reason} full />
              </dl>
            </Panel>

            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-card border p-4 text-sm transition-colors",
                agreeError && !agreed
                  ? "border-isg-bad/50 bg-isg-bad/5"
                  : "border-isg-line hover:border-isg-blue/40",
              )}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (e.target.checked) setAgreeError(false);
                }}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-isg-line accent-isg-blue"
              />
              <span className="text-isg-ink">
                Saya menyatakan data di atas benar dan menyetujui syarat serta ketentuan
                komunitas ISG.
                {agreeError && !agreed ? (
                  <span className="mt-1 block font-bold text-isg-bad">
                    Centang dulu sebelum mendaftar.
                  </span>
                ) : null}
              </span>
            </label>

            <p className="text-sm text-isg-muted">
              Setelah mendaftar, akunmu berstatus <strong>menunggu verifikasi</strong>.
              Admin akan meninjau dan menempatkanmu di angkatan.
            </p>

            {state.error ? (
              <p
                role="alert"
                className="flex items-start gap-2.5 rounded-card border border-isg-bad/25 bg-isg-bad/5 px-4 py-3 text-sm text-isg-bad"
              >
                <CircleAlert size={17} aria-hidden className="mt-0.5 shrink-0" />
                {state.error}
              </p>
            ) : null}
          </div>
        </Step>
      </Stepper>

      <p className="mt-6 text-center text-sm text-isg-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-isg-blue hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}

/** Panel tipis pembungkus field — bukan kartu tebal bershadow. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 sm:p-6">
      {children}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-12 w-full rounded-2xl border bg-isg-surface px-4 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70",
    hasError
      ? "border-isg-bad focus:border-isg-bad focus:ring-4 focus:ring-isg-bad/12"
      : "border-isg-line focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15",
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-isg-ink">
        {label}
        {optional ? <span className="ml-1.5 font-medium text-isg-muted">(opsional)</span> : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-isg-bad">
          <CircleAlert size={13} aria-hidden className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-isg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", full && "sm:col-span-2")}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-isg-muted">
        {label}
      </dt>
      <dd className="wrap-break-word text-sm font-semibold text-isg-ink">{value || "—"}</dd>
    </div>
  );
}
