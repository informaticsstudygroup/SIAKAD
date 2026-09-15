"use client";

import { useRef } from "react";
import { cn } from "@/utils/cn";

/** Kartu dengan sorot cahaya lembut yang mengikuti kursor. */
export function SpotlightCard({
  children,
  className,
  color = "rgba(255,255,255,0.55)",
  size = 220,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn("group/spot relative overflow-hidden", className)}
      style={{ ["--sx" as string]: "50%", ["--sy" as string]: "50%" }}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(circle ${size}px at var(--sx) var(--sy), ${color}, transparent 70%)`,
        }}
      />
    </div>
  );
}
