import { auth } from "@/lib/auth";
import { ParticipantDashboard } from "@/features/dashboard/participant/components/ParticipantDashboard";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MENTOR: "Mentor",
  CO_MENTOR: "Co-Mentor",
  ADVISOR: "Advisor",
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  if (user.role === "PARTICIPANT") {
    return <ParticipantDashboard name={user.name ?? "Peserta"} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="w-fit rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#0C81E4]">
        {ROLE_LABEL[user.role] ?? user.role}
      </span>
      <h1 className="text-xl font-semibold text-[#102033]">
        Dashboard {ROLE_LABEL[user.role] ?? user.role} segera hadir.
      </h1>
      <p className="max-w-sm text-sm text-[#64748B]">
        Halaman ini sedang dalam pengembangan bertahap, sama seperti Dashboard Peserta.
      </p>
    </div>
  );
}
