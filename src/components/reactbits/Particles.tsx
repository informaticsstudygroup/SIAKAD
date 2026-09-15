"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

type ParticlesProps = {
  particleColors?: string[];
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleBaseSize?: number;
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  disableRotation?: boolean;
  pixelRatio?: number;
  className?: string;
};

type P = {
  x: number;
  y: number;
  depth: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
};

/**
 * Padanan komponen Particles dari React Bits, ditulis dengan Canvas 2D.
 * Versi resminya memakai OGL (WebGL); prop-nya dibuat sama persis supaya bisa
 * ditukar tanpa mengubah pemakaian.
 */
export default function Particles({
  particleColors = ["#ffffff"],
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleBaseSize = 100,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  disableRotation = false,
  pixelRatio = 1,
  className,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(pixelRatio || 1, window.devicePixelRatio || 1);

    let width = 0;
    let height = 0;
    let particles: P[] = [];
    let raf = 0;
    let rotation = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    function build() {
      const rect = parent!.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: particleCount }, () => {
        // depth 0 = jauh (kecil, redup), 1 = dekat (besar, pekat)
        const depth = Math.random();
        const spread = Math.max(1, particleSpread) / 10;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          r: ((particleBaseSize / 100) * (0.6 + depth * 1.8) * spread) / 2,
          vx: (Math.random() - 0.5) * speed * (0.3 + depth),
          vy: (Math.random() - 0.5) * speed * (0.3 + depth),
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          alpha: alphaParticles ? 0.15 + depth * 0.55 : 0.35 + depth * 0.5,
        };
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      if (moveParticlesOnHover) {
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
      }
      if (!disableRotation) rotation += 0.00025;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // bungkus di tepi supaya kepadatannya tetap
        if (p.x < -p.r) p.x = width + p.r;
        if (p.x > width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = height + p.r;
        if (p.y > height + p.r) p.y = -p.r;

        const sway = disableRotation ? 0 : Math.sin(rotation * 60 + p.depth * 6) * 6 * p.depth;
        const px = p.x + pointer.x * particleHoverFactor * p.depth + sway;
        const py = p.y + pointer.y * particleHoverFactor * p.depth;

        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(px, py, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onPointerMove(event: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 40;
      pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 40;
    }

    build();
    if (reduced) {
      draw();
    } else {
      loop();
    }

    const observer = new ResizeObserver(() => {
      build();
      if (reduced) draw();
    });
    observer.observe(parent);
    if (moveParticlesOnHover && !reduced) {
      parent.addEventListener("mousemove", onPointerMove);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      parent.removeEventListener("mousemove", onPointerMove);
    };
  }, [
    particleColors,
    particleCount,
    particleSpread,
    speed,
    particleBaseSize,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    disableRotation,
    pixelRatio,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
