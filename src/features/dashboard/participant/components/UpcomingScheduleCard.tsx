import Link from "next/link";

export type ScheduleItem = {
  id: string;
  title: string;
  category: string;
  time: string;
  day: string;
  month: string;
};

export function UpcomingScheduleCard({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#102033]">Jadwal Terdekat</h3>
        <Link href="/dashboard/jadwal" className="text-xs font-medium text-[#0C81E4] hover:underline">
          Lihat Semua
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#64748B]">Belum ada jadwal pertemuan mendatang.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#E2E8F0]">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#0C81E4]/10 text-[#0C81E4]">
                <span className="text-[10px] font-medium uppercase leading-none">{item.month}</span>
                <span className="text-sm font-semibold leading-tight">{item.day}</span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-[#102033]">{item.title}</span>
                <span className="text-xs text-[#64748B]">
                  {item.category} &middot; {item.time}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
