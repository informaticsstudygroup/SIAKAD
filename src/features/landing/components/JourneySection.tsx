import Image from "next/image";

// Empat langkah ini sengaja sejajar dengan empat pulau di ilustrasi.
const STEPS = [
  {
    number: "01",
    title: "Daftar & Verifikasi",
    description: "Isi formulir singkat, lalu Admin memverifikasi dan menempatkanmu di angkatan.",
    dot: "bg-isg-blue",
  },
  {
    number: "02",
    title: "Ikuti Pertemuan",
    description: "Hadir di kelas, workshop, dan sharing session sesuai jadwal angkatanmu.",
    dot: "bg-isg-cyan",
  },
  {
    number: "03",
    title: "Kerjakan Tugas & Proyek",
    description: "Asah kemampuan lewat tugas, kuis berkala, dan proyek bersama tim.",
    dot: "bg-isg-mint",
  },
  {
    number: "04",
    title: "Dapat Sertifikat",
    description: "Penuhi syarat kehadiran dan tugas, lalu unduh e-certificate-mu.",
    dot: "bg-isg-sun",
  },
];

export function JourneySection() {
  return (
    <section id="alur" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="relative mb-10 flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-isg-blue">
            Alur belajar
          </span>
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-isg-ink sm:text-4xl">
            Empat langkah dari daftar sampai sertifikat
          </h2>
          <p className="max-w-xl text-base text-isg-ink-soft">
            Kamu tidak melompat sendirian. Tiap tahap ada mentor, teman seangkatan, dan
            catatan progres yang bisa kamu pantau di Mini SIAKAD.
          </p>
        </div>

        {/* Latar panel disamakan dengan warna kertas di ilustrasi supaya tepinya menyatu */}
        <div className="overflow-hidden rounded-xl2 bg-[#f5f2ea]">
          <Image
            src="/assets/journey-islands.png"
            alt="Empat pulau melayang yang terhubung jembatan, menggambarkan empat tahap belajar di ISG"
            width={1664}
            height={936}
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="w-full object-cover"
          />
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((step) => (
            <li key={step.number} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${step.dot}`} />
                <span className="text-xs font-bold tracking-[0.14em] text-isg-muted">
                  {step.number}
                </span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-isg-ink">
                {step.title}
              </h3>
              <p className="text-sm text-isg-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
