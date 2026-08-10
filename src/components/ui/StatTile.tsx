import { cn } from "@/utils/cn";

type StatTileTone = "hero" | "blue" | "mint" | "cyan" | "neutral";

const TONE_STYLES: Record<
  StatTileTone,
  { bg: string; label: string; value: string; badgeBg: string; badgeText: string }
> = {
  hero: {
    bg: "bg-[#071A3D]",
    label: "text-white/70",
    value: "text-white",
    badgeBg: "bg-white/15",
    badgeText: "text-white",
  },
  blue: {
    bg: "bg-[#0C81E4]/[0.08]",
    label: "text-[#64748B]",
    value: "text-[#102033]",
    badgeBg: "bg-white",
    badgeText: "text-[#0C81E4]",
  },
  mint: {
    bg: "bg-[#4FE7AF]/[0.15]",
    label: "text-[#64748B]",
    value: "text-[#102033]",
    badgeBg: "bg-white",
    badgeText: "text-[#0F9463]",
  },
  cyan: {
    bg: "bg-[#11C4D4]/[0.1]",
    label: "text-[#64748B]",
    value: "text-[#102033]",
    badgeBg: "bg-white",
    badgeText: "text-[#0891A6]",
  },
  neutral: {
    bg: "bg-[#F1F5F9]",
    label: "text-[#64748B]",
    value: "text-[#102033]",
    badgeBg: "bg-white",
    badgeText: "text-[#64748B]",
  },
};

export function StatTile({
  label,
  value,
  badge,
  tone = "neutral",
}: {
  label: string;
  value: string;
  badge?: string;
  tone?: StatTileTone;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={cn("flex flex-1 flex-col gap-4 rounded-2xl p-5", styles.bg)}>
      <span className={cn("text-sm font-medium", styles.label)}>{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className={cn("text-3xl font-semibold", styles.value)}>{value}</span>
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              styles.badgeBg,
              styles.badgeText,
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}
