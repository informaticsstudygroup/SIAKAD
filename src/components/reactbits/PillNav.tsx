"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/utils/cn";

export type PillNavItem = { label: string; href: string };

/**
 * Padanan GSAP easing ke cubic-bezier CSS. Versi resmi PillNav memakai GSAP;
 * di sini animasinya CSS, tapi prop `ease` tetap diterima agar API-nya sama.
 */
const EASE_MAP: Record<string, string> = {
  "power1.easeOut": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "power2.easeOut": "cubic-bezier(0.22, 0.61, 0.36, 1)",
  "power3.easeOut": "cubic-bezier(0.16, 1, 0.3, 1)",
  "power4.easeOut": "cubic-bezier(0.16, 1, 0.3, 1)",
  "back.out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "expo.out": "cubic-bezier(0.16, 1, 0.3, 1)",
};

type PillNavProps = {
  logo: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  theme?: "light" | "dark";
  initialLoadAnimation?: boolean;
  /** Tambahan di luar API React Bits: tombol aksi di sisi kanan. */
  rightSlot?: React.ReactNode;
  /** Ikut tampil di dalam menu mobile. */
  mobileSlot?: React.ReactNode;
  /**
   * Warna lingkaran logo, dipisah dari baseColor. Logo ISG berwarna
   * biru-cyan-mint dan dirancang untuk latar terang, jadi di atas bar gelap
   * warnanya tenggelam. Default mengikuti baseColor kalau tidak diisi.
   */
  logoBgColor?: string;
  /** Wordmark teks polos di sebelah logo. */
  logoText?: string;
  /**
   * Wordmark berupa gambar. isText.png milik ISG memakai huruf putih yang
   * di-knockout dari bar berwarna, jadi wadahnya WAJIB putih — kalau tidak,
   * hurufnya hilang. Karena itu logo dan wordmark dibungkus pill putih.
   */
  wordmark?: string;
  wordmarkAlt?: string;
};

export default function PillNav({
  logo,
  logoAlt = "Logo",
  items,
  activeHref,
  className,
  ease = "power3.easeOut",
  baseColor,
  pillColor,
  hoveredPillTextColor,
  pillTextColor,
  theme = "light",
  initialLoadAnimation = true,
  rightSlot,
  mobileSlot,
  logoBgColor,
  logoText,
  wordmark,
  wordmarkAlt = "",
}: PillNavProps) {
  const [open, setOpen] = useState(false);

  const isDark = theme === "dark";
  const resolved = {
    base: baseColor ?? (isDark ? "#ffffff" : "#0f1729"),
    pill: pillColor ?? (isDark ? "#0f1729" : "#ffffff"),
    text: pillTextColor ?? (isDark ? "#ffffff" : "#0f1729"),
    hoverText: hoveredPillTextColor ?? (isDark ? "#0f1729" : "#ffffff"),
    ease: EASE_MAP[ease] ?? ease,
  };
  const logoBg = logoBgColor ?? resolved.base;

  const styleVars = {
    ["--pn-base" as string]: resolved.base,
    ["--pn-pill" as string]: resolved.pill,
    ["--pn-text" as string]: resolved.text,
    ["--pn-hover-text" as string]: resolved.hoverText,
    ["--pn-ease" as string]: resolved.ease,
    ["--pn-logo-bg" as string]: logoBg,
  } as React.CSSProperties;

  return (
    <div style={styleVars} className={cn("relative", className)}>
      <nav className="flex items-center gap-2.5">
        {/* Logo — lingkaran penuh; warnanya bisa dipisah dari baseColor lewat
            logoBgColor supaya logo berwarna tetap terbaca. */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label={logoAlt}
          className={cn(
            "group/logo flex shrink-0 items-center gap-3 rounded-full p-2 pr-5 ring-1 ring-black/5",
            initialLoadAnimation && "motion-safe:animate-[pill-in_0.5s_backwards]",
          )}
          style={{ background: "var(--pn-logo-bg)" }}
        >
          <Image
            src={logo}
            alt=""
            width={500}
            height={500}
            aria-hidden
            className="h-12 w-12 transition-transform duration-500 group-hover/logo:rotate-18"
            style={{ transitionTimingFunction: "var(--pn-ease)" }}
          />

          {wordmark ? (
            <Image
              src={wordmark}
              alt={wordmarkAlt}
              width={1593}
              height={805}
              priority
              className="h-12 w-auto"
            />
          ) : logoText ? (
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ color: "var(--pn-text)" }}
            >
              {logoText}
            </span>
          ) : null}
        </Link>

        {/* Wadah pill — ditengahkan absolut supaya tidak menumpuk di kiri dan
            meninggalkan lubang kosong di tengah navbar. */}
        <div
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full p-1.5 lg:flex"
          style={{ background: "var(--pn-base)" }}
        >
          {items.map((item, index) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/pill relative isolate overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold",
                  initialLoadAnimation && "motion-safe:animate-[pill-in_0.5s_backwards]",
                )}
                style={{
                  background: active ? "transparent" : "var(--pn-pill)",
                  color: active ? "var(--pn-hover-text)" : "var(--pn-text)",
                  animationDelay: initialLoadAnimation ? `${60 + index * 55}ms` : undefined,
                }}
              >
                {/* Lingkaran yang naik dari bawah menutupi pill saat hover.
                    Transform ditulis eksplisit lewat transform-[...] — utility
                    translate-* di Tailwind v4 memakai properti `translate`,
                    bukan `transform`, sehingga lebih ambigu untuk dianimasikan. */}
                <span
                  aria-hidden
                  className="absolute bottom-0 left-1/2 -z-10 aspect-square w-[150%] rounded-full transition-transform duration-500 transform-[translate(-50%,100%)] group-hover/pill:transform-[translate(-50%,22%)]"
                  style={{
                    background: "var(--pn-base)",
                    transitionTimingFunction: "var(--pn-ease)",
                  }}
                />

                {/* Dua salinan label: yang lama naik keluar, yang baru masuk */}
                <span className="relative block h-5 overflow-hidden">
                  <span
                    className="block leading-5 transition-transform duration-500 transform-[translateY(0)] group-hover/pill:transform-[translateY(-100%)]"
                    style={{ transitionTimingFunction: "var(--pn-ease)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 block leading-5 transition-transform duration-500 transform-[translateY(100%)] group-hover/pill:transform-[translateY(0)]"
                    style={{
                      color: "var(--pn-hover-text)",
                      transitionTimingFunction: "var(--pn-ease)",
                    }}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {rightSlot ? <div className="ml-auto hidden lg:flex">{rightSlot}</div> : null}

        {/* Tombol menu mobile — lingkaran senada dengan logo */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="pillnav-mobile"
          className="ml-auto flex h-12 w-12 items-center justify-center rounded-full lg:hidden"
          style={{ background: "var(--pn-base)", color: "var(--pn-hover-text)" }}
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </nav>

      {open ? (
        <div
          id="pillnav-mobile"
          className="absolute inset-x-0 top-full z-50 mt-2 rounded-3xl p-2 shadow-pop lg:hidden"
          style={{ background: "var(--pn-base)" }}
        >
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => {
              const active = activeHref === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="block rounded-full px-5 py-3 text-sm font-bold"
                    style={{
                      background: active ? "transparent" : "var(--pn-pill)",
                      color: active ? "var(--pn-hover-text)" : "var(--pn-text)",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {mobileSlot ? (
            <div className="mt-2 flex flex-col gap-2 border-t border-white/15 p-1 pt-3">
              {mobileSlot}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
