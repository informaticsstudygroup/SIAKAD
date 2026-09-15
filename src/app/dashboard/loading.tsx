/**
 * Kerangka pemuatan untuk seluruh halaman /dashboard/*.
 *
 * Tanpa berkas ini, mengklik menu membuat halaman lama membeku tanpa tanda
 * apa pun sampai data selesai diambil — terasa seperti aplikasi menggantung.
 * Kehadiran loading.tsx juga membuat Next.js mau melakukan prefetch untuk
 * rute dinamis, sehingga perpindahannya terasa seketika.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8" aria-busy="true">
      <span className="sr-only" role="status">
        Memuat halaman...
      </span>

      {/* Judul */}
      <div className="flex flex-col gap-2">
        <Bar className="h-7 w-56" />
        <Bar className="h-4 w-72" />
      </div>

      {/* Baris kartu statistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface p-5"
          >
            <Bar className="h-3 w-24" />
            <Bar className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Daftar / tabel */}
      <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-isg-line px-5 py-4 last:border-b-0"
          >
            <Bar className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bar className="h-4 w-1/3" />
              <Bar className="h-3 w-1/4" />
            </div>
            <Bar className="h-8 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-lg bg-isg-line motion-safe:animate-pulse ${className}`}
    />
  );
}
