"use client";

import { useId, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/utils/cn";

export type TrendPoint = { label: string; value: number };
export type GradeTrendCategory = "Semua" | "Tugas" | "Kuis" | "Proyek";
export type GradeTrendData = Record<GradeTrendCategory, TrendPoint[]>;

const CATEGORIES: GradeTrendCategory[] = ["Semua", "Tugas", "Kuis", "Proyek"];
const BLUE = "#0C81E4";
const VIEW_W = 600;
const VIEW_H = 200;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function GradeTrendChart({ data }: { data: GradeTrendData }) {
  const [category, setCategory] = useState<GradeTrendCategory>("Semua");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const points = data[category];

  const { path, areaPath, coords, minValue, maxValue } = useMemo(() => {
    if (points.length === 0) {
      return { path: "", areaPath: "", coords: [] as { x: number; y: number }[], minValue: 0, maxValue: 0 };
    }
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const usableW = VIEW_W - PAD_X * 2;
    const usableH = VIEW_H - PAD_TOP - PAD_BOTTOM;

    const coords = points.map((p, i) => {
      const x = points.length === 1 ? VIEW_W / 2 : PAD_X + (usableW * i) / (points.length - 1);
      const y = PAD_TOP + usableH - ((p.value - min) / range) * usableH;
      return { x, y };
    });

    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const baseline = VIEW_H - PAD_BOTTOM;
    const areaPath = `${path} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`;

    return { path, areaPath, coords, minValue: min, maxValue: max };
  }, [points]);

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (coords.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const viewX = ratio * VIEW_W;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - viewX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setHoverIndex(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              category === item
                ? "bg-[#071A3D] text-white"
                : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative h-52 w-full">
        {points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[#64748B]">
            Belum ada data untuk kategori ini.
          </p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
              className="h-full w-full"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              role="img"
              aria-label={`Grafik tren nilai kategori ${category}`}
            >
              {[0.25, 0.5, 0.75].map((step) => (
                <line
                  key={step}
                  x1={0}
                  x2={VIEW_W}
                  y1={PAD_TOP + (VIEW_H - PAD_TOP - PAD_BOTTOM) * step}
                  y2={PAD_TOP + (VIEW_H - PAD_TOP - PAD_BOTTOM) * step}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
              ))}

              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>

              <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
              <path d={path} fill="none" stroke={BLUE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

              {coords.map((c, i) => {
                const isLast = i === coords.length - 1;
                const isHovered = i === hoverIndex;
                if (!isLast && !isHovered) return null;
                return (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={5}
                    fill={BLUE}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                );
              })}

              {hoveredCoord ? (
                <line
                  x1={hoveredCoord.x}
                  x2={hoveredCoord.x}
                  y1={PAD_TOP}
                  y2={VIEW_H - PAD_BOTTOM}
                  stroke="#94A3B8"
                  strokeWidth={1}
                />
              ) : null}
            </svg>

            <div className="pointer-events-none absolute inset-x-3 bottom-1 flex justify-between text-[11px] text-[#94A3B8]">
              <span>{points[0]?.label}</span>
              <span>{points[points.length - 1]?.label}</span>
            </div>

            {hovered && hoveredCoord ? (
              <div
                className="pointer-events-none absolute z-10 w-36 -translate-x-1/2 -translate-y-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs shadow-lg"
                style={{
                  left: `${(hoveredCoord.x / VIEW_W) * 100}%`,
                  top: `${(hoveredCoord.y / VIEW_H) * 100}%`,
                }}
              >
                <p className="font-semibold text-[#102033]">{hovered.value}</p>
                <p className="text-[#64748B]">{hovered.label}</p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {points.length > 0 ? (
        <p className="text-xs text-[#64748B]">
          Rentang nilai: {minValue}–{maxValue}
        </p>
      ) : null}
    </div>
  );
}
