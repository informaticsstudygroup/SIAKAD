import { Meter } from "@/components/ui/Meter";
import { cn } from "@/utils/cn";

export function CertificateEligibilityCard({
  attendancePercent,
  attendanceTarget,
  taskScore,
  taskTarget,
  quizScore,
  quizTarget,
  eligible,
}: {
  attendancePercent: number;
  attendanceTarget: number;
  taskScore: number;
  taskTarget: number;
  quizScore: number;
  quizTarget: number;
  eligible: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#102033]">Progress Kelayakan Sertifikat</h3>
        <span
          className={cn(
            "w-fit rounded-full px-2.5 py-1 text-xs font-medium",
            eligible ? "bg-[#16A36A]/10 text-[#16A36A]" : "bg-[#64748B]/10 text-[#64748B]",
          )}
        >
          {eligible ? "Memenuhi Syarat" : "Belum Memenuhi Syarat"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <Meter
          label="Kehadiran"
          percent={attendancePercent}
          valueLabel={`${attendancePercent}% (min. ${attendanceTarget}%)`}
          tone="blue"
        />
        <Meter
          label="Nilai Tugas"
          percent={(taskScore / taskTarget) * 100}
          valueLabel={`${taskScore} (min. ${taskTarget})`}
          tone="mint"
        />
        <Meter
          label="Nilai Kuis"
          percent={(quizScore / quizTarget) * 100}
          valueLabel={`${quizScore} (min. ${quizTarget})`}
          tone="cyan"
        />
      </div>
    </div>
  );
}
