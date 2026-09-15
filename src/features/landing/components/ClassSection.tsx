import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { TiltedCard } from "@/components/reactbits/TiltedCard";
import { cn } from "@/utils/cn";

const CLASSES = [
  {
    title: "Kelas Fundamental",
    description:
      "Mulai dari nol: logika, algoritma, dan kebiasaan menulis kode yang rapi.",
    src: "/assets/class-fundamental.png",
    featured: false,
  },
  {
    title: "Web Development",
    description:
      "Rakit halaman web utuh dari HTML, CSS, dan JavaScript, satu lapis demi satu lapis.",
    src: "/assets/class-webdev.png",
    featured: true,
  },
  {
    title: "React & Proyek",
    description:
      "Susun antarmuka dari komponen, lalu kerjakan proyek nyata bersama tim.",
    src: "/assets/tile-react.png",
    featured: false,
  },
];

export function ClassSection() {
  return (
    <section id="kelas" className="scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl2 border border-isg-line bg-isg-surface p-5 shadow-pop sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-isg-ink sm:text-4xl">
            Kelas Kami
          </h2>
          <p className="max-w-sm text-sm text-isg-muted sm:text-right">
            Tiga kelas yang dijalankan ISG saat ini, diurutkan dari yang paling dasar.
            Tidak perlu punya pengalaman coding untuk mulai.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CLASSES.map((item) => (
            <li key={item.title}>
              <TiltedCard className="h-full">
                <Link
                  href="/register"
                  className={cn(
                    "group flex h-full flex-col gap-4 rounded-card border p-5 transition-colors",
                    item.featured
                      ? "border-transparent bg-isg-blue text-white shadow-lift"
                      : "border-isg-line bg-isg-surface hover:border-isg-blue/35",
                  )}
                >
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className={cn(
                      "text-lg font-extrabold tracking-tight",
                      item.featured ? "text-white" : "text-isg-ink",
                    )}
                  >
                    {item.title}
                  </h3>
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:rotate-45",
                      item.featured
                        ? "bg-white text-isg-blue"
                        : "bg-isg-tint text-isg-blue",
                    )}
                  >
                    <ArrowUpRight size={16} strokeWidth={2.6} />
                  </span>
                </div>

                <p
                  className={cn(
                    "text-sm",
                    item.featured ? "text-white/85" : "text-isg-muted",
                  )}
                >
                  {item.description}
                </p>

                <div
                  className={cn(
                    "mt-auto overflow-hidden rounded-2xl",
                    item.featured ? "bg-isg-blue-deep/40" : "bg-isg-tint",
                  )}
                >
                  <Image
                    src={item.src}
                    alt={`Ilustrasi ${item.title}`}
                    width={1664}
                    height={936}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  </div>
                </Link>
              </TiltedCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
