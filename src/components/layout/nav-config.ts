import type { Role } from "@prisma/client";
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const PARTICIPANT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Presensi", href: "/dashboard/presensi", icon: ClipboardCheck },
  { label: "Tugas", href: "/dashboard/tugas", icon: FileText },
  { label: "Kuis", href: "/dashboard/kuis", icon: HelpCircle },
  { label: "Nilai", href: "/dashboard/nilai", icon: LineChart },
  { label: "Sertifikat", href: "/dashboard/sertifikat", icon: Award },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

const DEFAULT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  if (role === "PARTICIPANT") return PARTICIPANT_NAV;
  return DEFAULT_NAV;
}
