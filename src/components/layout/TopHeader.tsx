import { Bell } from "lucide-react";
import { AvatarMenu } from "@/components/layout/AvatarMenu";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MENTOR: "Mentor",
  CO_MENTOR: "Co-Mentor",
  PARTICIPANT: "Peserta",
  ADVISOR: "Advisor",
};

export function TopHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
      <span className="text-sm font-semibold text-[#102033] lg:hidden">ISG Mini SIAKAD</span>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifikasi"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F7FAFC] hover:text-[#102033]"
        >
          <Bell size={18} aria-hidden />
        </button>
        <AvatarMenu name={name} roleLabel={ROLE_LABEL[role] ?? role} />
      </div>
    </header>
  );
}
