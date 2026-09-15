import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DotGrid } from "@/components/reactbits/DotGrid";
import { BlurText } from "@/components/reactbits/BlurText";
import { Magnet } from "@/components/reactbits/Magnet";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-24">
      <DotGrid />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-isg-ink sm:text-5xl lg:text-[62px]">
            <BlurText text="Belajar, Berkembang, dan" />{" "}
            <span className="relative inline-block whitespace-nowrap rounded-full bg-isg-mint px-5 pb-1.5 pt-0.5 motion-safe:animate-[blur-in_0.7s_cubic-bezier(0.2,0.8,0.2,1)_backwards] [animation-delay:210ms]">
              Berkarya
            </span>{" "}
            <BlurText text="Bersama ISG" startDelay={280} />
          </h1>

          <p className="mt-6 max-w-xl text-base text-isg-ink-soft sm:text-lg">
            Komunitas belajar teknologi untuk mahasiswa Informatika. Dari dasar
            pemrograman sampai membangun web dengan React, dikerjakan bersama-sama.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-isg-muted">
              Empat materi inti
            </p>
            <p className="mt-1 text-lg font-extrabold tracking-tight text-isg-ink">
              Dasar Pemrograman &rarr; React
            </p>
          </div>

          <Magnet>
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-isg-blue py-2.5 pl-6 pr-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
            >
              Gabung Sekarang
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-isg-blue transition-transform group-hover:rotate-45">
                <ArrowUpRight size={17} strokeWidth={2.6} aria-hidden />
              </span>
            </Link>
          </Magnet>
        </div>
      </div>
    </section>
  );
}
