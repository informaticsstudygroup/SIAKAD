export type MonthlyAttendance = {
  month: string;
  hadir: number;
  izin: number;
  tidakHadir: number;
};

const LEGEND = [
  { key: "hadir", label: "Hadir", color: "#16A36A" },
  { key: "izin", label: "Izin", color: "#F59E0B" },
  { key: "tidakHadir", label: "Tidak Hadir", color: "#E5484D" },
] as const;

const TRACK_HEIGHT = 176;

function niceMax(value: number) {
  if (value <= 5) return 5;
  return Math.ceil(value / 5) * 5;
}

export function AttendanceBarChart({ data }: { data: MonthlyAttendance[] }) {
  const maxStack = niceMax(Math.max(...data.map((d) => d.hadir + d.izin + d.tidakHadir)));
  const gridSteps = [0, 0.5, 1];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        {LEGEND.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <div
          className="flex flex-col justify-between text-right text-[11px] text-[#94A3B8]"
          style={{ height: TRACK_HEIGHT }}
        >
          {[...gridSteps].reverse().map((step) => (
            <span key={step}>{Math.round(maxStack * step)}</span>
          ))}
        </div>

        <div className="relative flex flex-1 items-end gap-4 sm:gap-6">
          {gridSteps.map((step) => (
            <div
              key={step}
              aria-hidden
              className="absolute inset-x-0 border-t border-[#E2E8F0]"
              style={{ bottom: step * TRACK_HEIGHT }}
            />
          ))}

          {data.map((month) => {
            const total = month.hadir + month.izin + month.tidakHadir;

            return (
              <div
                key={month.month}
                tabIndex={0}
                className="group relative flex flex-1 flex-col items-center gap-2 outline-none"
              >
                <div
                  role="tooltip"
                  className="pointer-events-none absolute top-2 left-1/2 z-10 w-40 -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <p className="mb-1.5 font-semibold text-[#102033]">{month.month} — {total} pertemuan</p>
                  <dl className="flex flex-col gap-1">
                    {LEGEND.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <dt className="flex items-center gap-1.5 text-[#64748B]">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </dt>
                        <dd className="font-semibold text-[#102033]">{month[item.key]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div
                  className="flex w-full max-w-6 flex-col-reverse gap-[2px] rounded-t-[4px]"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <div
                    className="w-full bg-[#16A36A] transition-[filter] group-hover:brightness-95"
                    style={{ height: `${(month.hadir / maxStack) * 100}%` }}
                  />
                  <div
                    className="w-full bg-[#F59E0B] transition-[filter] group-hover:brightness-95"
                    style={{ height: `${(month.izin / maxStack) * 100}%` }}
                  />
                  <div
                    className="w-full rounded-t-[4px] bg-[#E5484D] transition-[filter] group-hover:brightness-95"
                    style={{ height: `${(month.tidakHadir / maxStack) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#64748B]">{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
