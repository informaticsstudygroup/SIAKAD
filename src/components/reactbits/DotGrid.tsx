"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

/**
 * Latar titik-titik yang menyala mengikuti kursor.
 * Dua lapis pola yang sama: lapis dasar redup, lapis aksen dipotong mask radial
 * di posisi kursor. Tidak ada canvas dan tidak ada rAF, jadi murah.
 *
 * Listener dipasang ke elemen induk, bukan ke dirinya sendiri, supaya lapisan ini
 * bisa tetap pointer-events-none dan tidak menghalangi klik tombol di atasnya.
 */
export function DotGrid({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    function onMove(event: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      el!.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      el!.style.setProperty("--my", `${event.clientY - rect.top}px`);
      el!.style.setProperty("--on", "1");
    }

    function onLeave() {
      el!.style.setProperty("--on", "0");
    }

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        ["--mx" as string]: "50%",
        ["--my" as string]: "50%",
        ["--on" as string]: "0",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd9e8 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 40%, #000 35%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--on)",
          backgroundImage: "radial-gradient(circle, #0c81e4 1.8px, transparent 1.8px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(circle 140px at var(--mx) var(--my), #000 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
