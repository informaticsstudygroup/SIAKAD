import { cn } from "@/utils/cn";

/**
 * Teks yang masuk kata per kata dari blur.
 * animation-fill-mode backwards dipakai sengaja: keadaan diam elemen ini adalah
 * TERLIHAT, animasi hanya memutar mundur dari situ. Jadi kalau animasi dimatikan
 * (prefers-reduced-motion) atau CSS gagal dimuat, teksnya tetap terbaca penuh.
 */
export function BlurText({
  text,
  className,
  wordClassName,
  delayStep = 70,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delayStep?: number;
  startDelay?: number;
}) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        // Spasi sengaja diletakkan DI LUAR span. Kalau ditaruh di dalam,
        // browser menciutkan whitespace di ujung inline-block dan semua kata
        // menempel jadi satu ("Belajar,Berkembang,dan").
        <span key={`${word}-${index}`}>
          <span
            className={cn(
              "inline-block motion-safe:animate-[blur-in_0.7s_cubic-bezier(0.2,0.8,0.2,1)_backwards]",
              wordClassName,
            )}
            style={{ animationDelay: `${startDelay + index * delayStep}ms` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
