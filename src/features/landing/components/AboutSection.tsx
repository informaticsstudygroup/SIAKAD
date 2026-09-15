// Bagian ini sengaja BUKAN kartu: tanpa border, tanpa shadow, cuma garis pemisah.
// Halaman ini sudah penuh kartu — kalau semuanya dibingkai, hierarkinya jadi rata.
const POINTS = [
  {
    title: "Ada mentor di tiap angkatan",
    body: "Satu mentor dan satu co-mentor mendampingi kelas dari awal sampai selesai, bukan cuma memberi materi lalu pergi.",
  },
  {
    title: "Semua pertemuan terekam",
    body: "Materi dan catatan tiap sesi tersimpan di Mini SIAKAD, jadi ketinggalan satu pertemuan bukan berarti tertinggal selamanya.",
  },
  {
    title: "Progresmu terlihat angkanya",
    body: "Presensi, tugas, kuis, dan nilai tercatat otomatis. Kamu tahu posisimu tanpa harus bertanya ke siapa pun.",
  },
  {
    title: "Sertifikat punya syarat jelas",
    body: "Minimal 80% kehadiran dan tugas terkumpul. Bukan sertifikat yang dibagikan begitu saja ke semua orang.",
  },
];

export function AboutSection() {
  return (
    <section id="tentang" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-isg-blue">
            Tentang ISG
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-isg-ink sm:text-4xl">
            Komunitas belajar, bukan kelas tambahan.
          </h2>
          <p className="mt-5 text-base text-isg-ink-soft">
            Informatics Study Group dibentuk mahasiswa Informatika yang ingin belajar
            teknologi di luar kelas formal. Yang membedakannya dari sekadar grup belajar
            adalah empat hal berikut.
          </p>
        </div>

        <ul className="flex flex-col">
          {POINTS.map((point, index) => (
            <li
              key={point.title}
              className="flex gap-5 border-t border-isg-line py-6 first:border-t-0 first:pt-0 lg:gap-8"
            >
              <span className="pt-1 text-sm font-bold tabular-nums text-isg-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-isg-ink">
                  {point.title}
                </h3>
                <p className="mt-1.5 text-base text-isg-ink-soft">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
