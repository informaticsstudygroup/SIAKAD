import { StatusChip, type StatusKind } from "@/components/ui/StatusChip";

export type ActivityItem = {
  id: string;
  title: string;
  date: string;
  status: StatusKind;
};

export function ActivityFeedCard({ items }: { items: ActivityItem[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="text-base font-semibold text-[#102033]">Pengumuman &amp; Aktivitas Terakhir</h3>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#64748B]">Belum ada aktivitas terbaru.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#E2E8F0]">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#102033]">{item.title}</span>
                <span className="text-xs text-[#64748B]">{item.date}</span>
              </div>
              <StatusChip status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
