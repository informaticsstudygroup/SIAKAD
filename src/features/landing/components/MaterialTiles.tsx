import Image from "next/image";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

const MATERIALS = [
  {
    title: "Dasar Pemrograman",
    caption: "Logika, alur, dan cara berpikir sebelum menulis kode.",
    src: "/assets/tile-daspro.png",
  },
  {
    title: "Web Development",
    caption: "HTML untuk struktur, CSS untuk tampilan, JavaScript untuk interaksi.",
    src: "/assets/tile-webdev.png",
  },
  {
    title: "React",
    caption: "Membangun antarmuka dari komponen yang bisa dipakai ulang.",
    src: "/assets/tile-react.png",
  },
  {
    title: "Kolaborasi",
    caption: "Kerja tim, review, dan membangun proyek bareng.",
    src: "/assets/tile-kolaborasi.png",
  },
];

export function MaterialTiles() {
  return (
    <section id="materi" className="scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {MATERIALS.map((item, index) => (
          <li key={item.title} className="group flex flex-col gap-4">
            {/* Tile ini sengaja tanpa border dan tanpa shadow — gambarnya sendiri
                sudah jadi blok warna pekat, jadi tidak perlu dibingkai lagi. */}
            <SpotlightCard className="rounded-card" size={190}>
              <Image
                src={item.src}
                alt={`Ilustrasi materi ${item.title}`}
                width={1248}
                height={1248}
                priority={index < 2}
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </SpotlightCard>

            <div className="px-1">
              <h3 className="text-base font-extrabold tracking-tight text-isg-ink">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-isg-muted">{item.caption}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
