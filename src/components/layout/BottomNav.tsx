"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { cn } from "@/utils/cn";
import { getNavItemsForRole } from "@/components/layout/nav-config";

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visibleItems = getNavItemsForRole(role).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#E2E8F0] bg-white lg:hidden">
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              isActive ? "text-[#0C81E4]" : "text-[#64748B]",
            )}
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
