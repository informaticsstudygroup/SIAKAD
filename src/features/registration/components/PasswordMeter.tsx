"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

export const PASSWORD_RULES = [
  { id: "len", label: "Minimal 8 karakter", test: (v: string) => v.length >= 8 },
  { id: "case", label: "Ada huruf besar dan kecil", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "num", label: "Ada angka", test: (v: string) => /\d/.test(v) },
  { id: "sym", label: "Ada simbol (!@#$…)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: "Terlalu lemah", bar: "bg-isg-bad", text: "text-isg-bad" },
  { label: "Lemah", bar: "bg-isg-bad", text: "text-isg-bad" },
  { label: "Cukup", bar: "bg-isg-warn", text: "text-isg-warn" },
  { label: "Kuat", bar: "bg-isg-blue", text: "text-isg-blue" },
  { label: "Sangat kuat", bar: "bg-isg-ok", text: "text-isg-ok" },
];

export function scorePassword(value: string) {
  return PASSWORD_RULES.reduce((total, rule) => total + (rule.test(value) ? 1 : 0), 0);
}

export function PasswordMeter({ value }: { value: string }) {
  const score = scorePassword(value);
  const level = LEVELS[score];

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? level.bar : "bg-isg-line",
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-bold", value ? level.text : "text-isg-muted")}>
          {value ? level.label : "Belum diisi"}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                ok ? "text-isg-ok" : "text-isg-muted",
              )}
            >
              {ok ? (
                <Check size={13} strokeWidth={3} aria-hidden />
              ) : (
                <X size={13} strokeWidth={3} aria-hidden className="opacity-40" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
