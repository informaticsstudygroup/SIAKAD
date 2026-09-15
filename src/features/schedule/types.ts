import type { MeetingCategory } from "@prisma/client";

export type MeetingRow = {
  id: string;
  title: string;
  category: MeetingCategory;
  batchId: string;
  batch: { id: string; name: string };
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string | null;
  meetingLink: string | null;
  description: string | null;
  attendanceOpen: boolean;
  _count: { attendances: number };
};

export type BatchOption = { id: string; name: string };

export const MEETING_CATEGORY_LABEL: Record<MeetingCategory, string> = {
  KELAS: "Kelas",
  WORKSHOP: "Workshop",
  SHARING_SESSION: "Sharing Session",
  EVENT: "Event",
  PROJECT: "Proyek",
};

export const MEETING_CATEGORY_TONE: Record<MeetingCategory, string> = {
  KELAS: "bg-isg-blue/10 text-isg-blue",
  WORKSHOP: "bg-isg-cyan/15 text-[#0891a6]",
  SHARING_SESSION: "bg-isg-mint/20 text-isg-ok",
  EVENT: "bg-isg-sun/20 text-[#a56a00]",
  PROJECT: "bg-isg-tint text-isg-ink-soft",
};

/** "19:00 – 21:00" memakai jam lokal. */
export function formatTimeRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}
