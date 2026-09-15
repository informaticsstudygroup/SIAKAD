"use client";

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

/** Penanda satu langkah. Isinya dirender apa adanya oleh Stepper. */
export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

type StepperProps = {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  disableStepIndicators?: boolean;

  /* Tambahan di luar API React Bits, dipakai form pendaftaran ISG: */
  /** Dipanggil sebelum pindah maju. Kembalikan false untuk menahan langkah. */
  validateStep?: (step: number) => boolean;
  /** Label di bawah tiap lingkaran indikator. */
  stepLabels?: string[];
  /** Tombol terakhir jadi type="submit" supaya form terkirim ke server action. */
  submitOnFinal?: boolean;
  isSubmitting?: boolean;
  className?: string;
};

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = "Back",
  nextButtonText = "Continue",
  completeButtonText = "Complete",
  disableStepIndicators = false,
  validateStep,
  stepLabels,
  submitOnFinal = false,
  isSubmitting = false,
  className,
}: StepperProps) {
  const steps = Children.toArray(children);
  const total = steps.length;

  const [current, setCurrent] = useState(Math.min(Math.max(initialStep, 1), total));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [height, setHeight] = useState<number | "auto">("auto");

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const isLast = current === total;

  // Tinggi wadah diikutkan ke tinggi isi langkah aktif, supaya pergantian
  // langkah tidak membuat halaman melompat.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setHeight(el.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [current]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onStepChange?.(current);
    viewportRef.current?.focus();
  }, [current, onStepChange]);

  function goNext() {
    if (validateStep && !validateStep(current)) return;
    if (isLast) {
      onFinalStepCompleted?.();
      return;
    }
    setDirection(1);
    setCurrent((s) => Math.min(total, s + 1));
  }

  function goBack() {
    setDirection(-1);
    setCurrent((s) => Math.max(1, s - 1));
  }

  function jumpTo(step: number) {
    if (step >= current) return;
    setDirection(-1);
    setCurrent(step);
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {!disableStepIndicators ? (
        <ol className="mb-6 flex items-center gap-2">
          {steps.map((_, index) => {
            const step = index + 1;
            const done = current > step;
            const active = current === step;
            return (
              <li key={step} className="flex flex-1 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => jumpTo(step)}
                  disabled={step >= current}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-all duration-300",
                    done && "cursor-pointer bg-isg-ok text-white hover:bg-isg-ok/85",
                    active && "scale-110 bg-isg-blue text-white ring-4 ring-isg-blue/20",
                    !done && !active && "bg-isg-line text-isg-muted",
                  )}
                >
                  {done ? <Check size={16} strokeWidth={3} aria-hidden /> : step}
                  <span className="sr-only">
                    Langkah {step}
                    {stepLabels?.[index] ? `, ${stepLabels[index]}` : ""}
                    {done ? ", sudah diisi" : active ? ", sedang diisi" : ", belum diisi"}
                  </span>
                </button>

                {stepLabels?.[index] ? (
                  <span
                    className={cn(
                      "hidden text-sm font-bold transition-colors sm:block",
                      active || done ? "text-isg-ink" : "text-isg-muted",
                    )}
                  >
                    {stepLabels[index]}
                  </span>
                ) : null}

                {step < total ? (
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-isg-line">
                    <div
                      className="h-full rounded-full bg-isg-ok transition-all duration-500 ease-out"
                      style={{ width: done ? "100%" : "0%" }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {/*
        Wadah ini overflow-hidden demi animasi geser, dan itu ikut memotong
        cincin fokus input yang menonjol keluar batas. Padding di dalam viewport
        memberi ruang cincin (overflow memotong di tepi padding, bukan tepi
        konten), lalu -mx di pembungkus mengembalikan perataan visualnya.
      */}
      <div className="-mx-2">
        <div
          ref={viewportRef}
          tabIndex={-1}
          style={{ height, outline: "none" }}
          className="overflow-hidden px-2 transition-[height] duration-400 ease-out"
        >
          <div
            ref={contentRef}
            key={current}
            className={cn(
              "py-1.5 motion-safe:animate-[step-in_0.4s_cubic-bezier(0.2,0.8,0.2,1)]",
              direction === 1 ? "[--step-from:32px]" : "[--step-from:-32px]",
            )}
          >
            {steps[current - 1]}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-isg-line pt-4">
        {current > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold text-isg-ink-soft transition-colors hover:bg-isg-tint hover:text-isg-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            {backButtonText}
          </button>
        ) : (
          <span />
        )}

        <button
          type={isLast && submitOnFinal ? "submit" : "button"}
          onClick={isLast && submitOnFinal ? undefined : goNext}
          disabled={isSubmitting}
          className={cn(
            "flex items-center gap-2 rounded-full bg-isg-blue py-3 pl-6 pr-5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
            isSubmitting && "cursor-not-allowed opacity-70",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} aria-hidden className="animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              {isLast ? completeButtonText : nextButtonText}
              <ArrowRight size={16} aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
