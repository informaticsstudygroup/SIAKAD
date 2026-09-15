import { cn } from "@/utils/cn";

/** Teks dengan kilau yang menyapu pelan dari kiri ke kanan. */
export function ShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent motion-safe:animate-[shine_5s_linear_infinite]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(110deg, var(--color-isg-ink-soft) 40%, var(--color-isg-blue) 50%, var(--color-isg-ink-soft) 60%)",
        backgroundSize: "260% 100%",
      }}
    >
      {children}
    </span>
  );
}
