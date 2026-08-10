type MeterTone = "blue" | "cyan" | "mint" | "success" | "warning" | "danger";

const TONE_COLOR: Record<MeterTone, string> = {
  blue: "#0C81E4",
  cyan: "#11C4D4",
  mint: "#4FE7AF",
  success: "#16A36A",
  warning: "#F59E0B",
  danger: "#E5484D",
};

export function Meter({
  label,
  percent,
  valueLabel,
  tone = "blue",
}: {
  label: string;
  percent: number;
  valueLabel?: string;
  tone?: MeterTone;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#102033]">{label}</span>
        <span className="text-[#64748B]">{valueLabel ?? `${clamped}%`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: TONE_COLOR[tone] }}
        />
      </div>
    </div>
  );
}
