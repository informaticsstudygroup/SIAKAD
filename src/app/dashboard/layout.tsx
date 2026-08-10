import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopHeader } from "@/components/layout/TopHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F7FAFC]">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader name={session.user.name ?? "Pengguna"} role={session.user.role} />
        <main className="flex flex-1 flex-col overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomNav role={session.user.role} />
    </div>
  );
}
