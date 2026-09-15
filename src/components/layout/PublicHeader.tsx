"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import PillNav from "@/components/reactbits/PillNav";

const NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Tentang", href: "/#tentang" },
  { label: "Materi", href: "/#materi" },
  { label: "Kelas", href: "/#kelas" },
  { label: "Alur", href: "/#alur" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <PillNav
        logo="/LOGOISG.png"
        logoAlt="Beranda ISG Mini SIAKAD"
        wordmark="/isText.png"
        wordmarkAlt="Informatics Study Group"
        items={NAV_ITEMS}
        activeHref={pathname}
        ease="power3.easeOut"
        theme="light"
        /*
          Warna disesuaikan ke palet ISG dan diseimbangkan kiri-kanan:
          - lingkaran logo PUTIH, karena logo ISG biru-cyan-mint dirancang untuk
            latar terang dan warnanya tenggelam di atas navy;
          - bar pill biru ISG, lebih ringan dari hitam dan langsung on-brand;
          - tombol Daftar gelap, jadi bobot gelapnya terbagi ke dua ujung.
        */
        logoBgColor="#ffffff"
        baseColor="#0c81e4"
        pillColor="#ffffff"
        pillTextColor="#0f1729"
        hoveredPillTextColor="#ffffff"
        initialLoadAnimation
        className="mx-auto max-w-6xl"
        rightSlot={
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full bg-isg-surface px-5 py-3 text-sm font-bold text-isg-ink ring-1 ring-black/5 transition-colors hover:bg-isg-tint"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="group flex items-center gap-1.5 rounded-full bg-isg-ink py-2 pl-5 pr-2 text-sm font-bold text-white shadow-nav transition-colors hover:bg-isg-navy"
            >
              Daftar
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-isg-mint text-isg-ink transition-transform group-hover:rotate-45">
                <ArrowUpRight size={15} strokeWidth={2.6} aria-hidden />
              </span>
            </Link>
          </div>
        }
        mobileSlot={
          <>
            <Link
              href="/login"
              className="rounded-full bg-isg-surface px-5 py-3 text-center text-sm font-bold text-isg-ink"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-isg-blue px-5 py-3 text-center text-sm font-bold text-white"
            >
              Daftar Sekarang
            </Link>
          </>
        }
      />
    </header>
  );
}
