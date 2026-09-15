import type { Role } from "@prisma/client";
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  UserCheck,
  Users,
  User,
  Eye,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Hanya menu yang halamannya sudah ada. Menambahkan menu untuk halaman yang
// belum dibuat hanya menghasilkan tautan 404.
const PARTICIPANT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Presensi", href: "/dashboard/presensi", icon: ClipboardCheck },
  { label: "Tugas", href: "/dashboard/tugas", icon: FileText },
  { label: "Kuis", href: "/dashboard/kuis", icon: HelpCircle },
  { label: "Nilai", href: "/dashboard/nilai", icon: LineChart },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pendaftar", href: "/dashboard/pendaftar", icon: UserCheck },
  { label: "Akun", href: "/dashboard/akun", icon: Users },
  { label: "Angkatan", href: "/dashboard/angkatan", icon: GraduationCap },
  { label: "Pantau", href: "/dashboard/pantau", icon: Eye },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Tugas", href: "/dashboard/tugas", icon: FileText },
  { label: "Kuis", href: "/dashboard/kuis", icon: HelpCircle },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

// Mentor dan Co-Mentor mengelola pertemuan, tugas, kuis, dan memantau peserta angkatan binaan.
const MENTOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Progres Peserta", href: "/dashboard/pantau", icon: Eye },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Tugas", href: "/dashboard/tugas", icon: FileText },
  { label: "Kuis", href: "/dashboard/kuis", icon: HelpCircle },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

// Advisor hanya memantau: tidak ada satu pun menu yang mengubah data.
const ADVISOR_NAV: NavItem[] = [
  { label: "Pemantauan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Progres Peserta", href: "/dashboard/pantau", icon: Eye },
  { label: "Jadwal", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Tugas", href: "/dashboard/tugas", icon: FileText },
  { label: "Kuis", href: "/dashboard/kuis", icon: HelpCircle },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

const DEFAULT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  if (role === "PARTICIPANT") return PARTICIPANT_NAV;
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "MENTOR" || role === "CO_MENTOR") return MENTOR_NAV;
  if (role === "ADVISOR") return ADVISOR_NAV;
  return DEFAULT_NAV;
}
