"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { cn } from "@/utils/cn";
import { getNavItemsForRole } from "@/components/layout/nav-config";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getNavItemsForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#E2E8F0] bg-white px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <Image src="/LOGOISG.png" alt="ISG" width={32} height={32} />
        <span className="text-sm font-semibold text-[#102033]">ISG Mini SIAKAD</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#0C81E4]/10 text-[#0C81E4]"
                  : "text-[#64748B] hover:bg-[#F7FAFC] hover:text-[#102033]",
              )}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
              {item.label}
              {isActive ? (
                <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4FE7AF]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
