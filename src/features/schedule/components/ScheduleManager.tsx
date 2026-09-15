"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Video,
} from "lucide-react";
import { MeetingFormDrawer } from "@/features/schedule/components/MeetingFormDrawer";
import { deleteMeeting } from "@/features/schedule/actions/meeting-actions";
import {
  MEETING_CATEGORY_LABEL,
  MEETING_CATEGORY_TONE,
  formatTimeRange,
  type BatchOption,
  type MeetingRow,
} from "@/features/schedule/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateID } from "@/utils/format-date";
import { cn } from "@/utils/cn";

export function ScheduleManager({
  meetings,
  batches,
  canManage,
}: {
  meetings: MeetingRow[];
  batches: BatchOption[];
  /** Peserta hanya membaca; staf bisa menambah, mengubah, dan membuka presensi. */
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MeetingRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<MeetingRow | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  async function confirmRemove() {
    if (!removing) return;
    setIsRemoving(true);
    setRemoveError("");
    const result = await deleteMeeting(removing.id);
    setIsRemoving(false);
    if (result.error) {
      setRemoveError(result.error);
      return;
    }
    setRemoving(null);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Jadwal</h1>
          <p className="text-sm text-isg-muted">
            {meetings.length} pertemuan terjadwal.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={batches.length === 0}
            title={batches.length === 0 ? "Buat angkatan dulu" : undefined}
            className={cn(
              "flex w-fit items-center gap-2 rounded-full bg-isg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep",
              batches.length === 0 && "cursor-not-allowed opacity-60",
            )}
          >
            <Plus size={16} aria-hidden />
            Tambah Pertemuan
          </button>
        ) : null}
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
          <CalendarDays size={32} aria-hidden className="text-isg-muted" />
          <p className="text-sm font-semibold text-isg-ink">Belum ada pertemuan</p>
          <p className="max-w-xs text-sm text-isg-muted">
            {canManage
              ? "Tambahkan pertemuan pertama untuk angkatan yang sedang berjalan."
              : "Mentor belum menjadwalkan pertemuan untuk angkatanmu."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {meetings.map((meeting) => (
            <li
              key={meeting.id}
              className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      MEETING_CATEGORY_TONE[meeting.category],
                    )}
                  >
                    {MEETING_CATEGORY_LABEL[meeting.category]}
                  </span>
                  <span className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-bold text-isg-ink-soft">
                    {meeting.batch.name}
                  </span>
                  {meeting.attendanceOpen ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-isg-ok/10 px-2.5 py-1 text-xs font-bold text-isg-ok">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-isg-ok motion-safe:animate-pulse"
                      />
                      Presensi dibuka
                    </span>
                  ) : null}
                </div>

                <h2 className="truncate text-lg font-extrabold tracking-tight text-isg-ink">
                  {meeting.title}
                </h2>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-isg-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} aria-hidden />
                    {formatDateID(meeting.date)} · {formatTimeRange(meeting.startTime, meeting.endTime)}
                  </span>
                  {meeting.location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} aria-hidden />
                      {meeting.location}
                    </span>
                  ) : null}
                  {meeting.meetingLink ? (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 font-semibold text-isg-blue hover:underline"
                    >
                      <Video size={14} aria-hidden />
                      Tautan daring
                    </a>
                  ) : null}
                </div>
              </div>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/jadwal/${meeting.id}/presensi`}
                    className="flex items-center gap-2 rounded-full bg-isg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-isg-navy"
                  >
                    <QrCode size={15} aria-hidden />
                    Presensi
                    <span className="font-mono text-xs opacity-70">
                      {meeting._count.attendances}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditing(meeting)}
                    aria-label={`Ubah ${meeting.title}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-blue"
                  >
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveError("");
                      setRemoving(meeting);
                    }}
                    aria-label={`Hapus ${meeting.title}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-bad/10 hover:text-isg-bad"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <MeetingFormDrawer
          meeting={null}
          batches={batches}
          onClose={() => setCreating(false)}
        />
      ) : null}
      {editing ? (
        <MeetingFormDrawer
          meeting={editing}
          batches={batches}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Hapus pertemuan?"
          description={`"${removing.title}" beserta catatan presensinya akan dihapus permanen.`}
          confirmLabel="Hapus"
          isDanger
          isPending={isRemoving}
          error={removeError}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
    </div>
  );
}
