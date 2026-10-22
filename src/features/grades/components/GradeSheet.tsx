"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  Download,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Search,
  Table2,
} from "lucide-react";
import { saveGradeChanges } from "@/features/grades/actions";
import {
  formatScore,
  isCellEditable,
  parseScore,
  type GradeChange,
  type GradeColumn,
  type GradeRow,
  type GradeSheetData,
} from "@/features/grades/types";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

type PendingChange = GradeChange & {
  key: string;
  name: string;
  columnTitle: string;
  before: number | null;
};

function cellKey(participantId: string, columnKey: string) {
  return `${participantId}|${columnKey}`;
}

function average(values: (number | null)[]) {
  const numbers = values.filter((v): v is number => v !== null);
  if (numbers.length === 0) return null;
  return Math.round(numbers.reduce((sum, v) => sum + v, 0) / numbers.length);
}

export function GradeSheet({
  data,
  batchName,
  canEdit,
  scoreTarget,
  attendanceTarget,
}: {
  data: GradeSheetData;
  batchName: string;
  canEdit: boolean;
  scoreTarget: number;
  attendanceTarget: number;
}) {
  const router = useRouter();
  const tableRef = useRef<HTMLTableElement>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const quizColumns = data.columns.filter((c) => c.kind === "quiz");
  const assignmentColumns = data.columns.filter((c) => c.kind === "assignment");
  const columns = [...quizColumns, ...assignmentColumns];
  const showProgress = data.rows.some((row) => row.progress);

  const normalizedQuery = query.trim().toLowerCase();
  const rows = normalizedQuery
    ? data.rows.filter(
        (row) =>
          row.name.toLowerCase().includes(normalizedQuery) ||
          row.studentId.toLowerCase().includes(normalizedQuery),
      )
    : data.rows;

  // ---- Perubahan yang belum disimpan ----
  const pending: PendingChange[] = [];
  const invalid = new Set<string>();
  const rowById = new Map(data.rows.map((row) => [row.participantId, row]));
  const columnByKey = new Map(columns.map((column) => [column.key, column]));

  for (const [key, raw] of Object.entries(drafts)) {
    const [participantId, colKey] = key.split("|");
    const row = rowById.get(participantId);
    const column = columnByKey.get(colKey);
    if (!row || !column) continue;
    const before = row.cells[colKey]?.score ?? null;
    const parsed = parseScore(raw);
    if (!parsed.ok || (column.kind === "quiz" && parsed.value === null && before !== null)) {
      invalid.add(key);
      continue;
    }
    if (parsed.value === before) continue;
    pending.push({
      key,
      participantId,
      kind: column.kind,
      refId: column.refId,
      score: parsed.value,
      name: row.name,
      columnTitle: column.title,
      before,
    });
  }

  const pendingKeys = new Set(pending.map((p) => p.key));
  const dirty = pending.length > 0 || invalid.size > 0;

  // Peringatan sebelum meninggalkan halaman dengan nilai yang belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function valueOf(row: GradeRow, column: GradeColumn): number | null {
    const key = cellKey(row.participantId, column.key);
    if (key in drafts && !invalid.has(key)) {
      const parsed = parseScore(drafts[key]);
      if (parsed.ok) return parsed.value;
    }
    return row.cells[column.key]?.score ?? null;
  }

  function setDraft(key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  function revertCell(key: string) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Pindah fokus ke sel lain yang bisa diedit, seperti di spreadsheet. */
  function moveFocus(rowIndex: number, colIndex: number, dRow: number, dCol: number) {
    const table = tableRef.current;
    if (!table) return;
    let r = rowIndex + dRow;
    let c = colIndex + dCol;
    while (r >= 0 && r < rows.length && c >= 0 && c < columns.length) {
      const target = table.querySelector<HTMLInputElement>(`[data-cell="${r}-${c}"]`);
      if (target) {
        target.focus();
        return;
      }
      r += dRow;
      c += dCol;
    }
  }

  async function confirmSave() {
    setSaving(true);
    setSaveError("");
    const result = await saveGradeChanges(
      data.batchId,
      pending.map(({ participantId, kind, refId, score }) => ({
        participantId,
        kind,
        refId,
        score,
      })),
    );
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setReviewing(false);
    setDrafts({});
    setToast({
      id: Date.now(),
      tone: "success",
      title: "Nilai tersimpan",
      description: `${result.saved} nilai diperbarui.`,
    });
    router.refresh();
  }

  function downloadCsv() {
    // Titik koma dan koma desimal supaya langsung terbaca benar oleh Excel
    // berbahasa Indonesia.
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const num = (value: number | null) =>
      value === null ? "" : formatScore(value).replace(".", ",");
    const header = [
      "No",
      "Nama",
      "NIM",
      ...(showProgress ? ["Kehadiran (%)"] : []),
      ...columns.map((c) => `${c.label}: ${c.title}`),
      "Rata-rata Kuis",
      "Rata-rata Tugas",
      ...(showProgress ? ["Sertifikat"] : []),
    ];
    const lines = data.rows.map((row, index) => {
      const values = columns.map((column) => valueOf(row, column));
      return [
        String(index + 1),
        escape(row.name),
        escape(row.studentId),
        ...(showProgress ? [num(row.progress?.attendancePercent ?? null)] : []),
        ...values.map(num),
        num(average(quizColumns.map((c) => valueOf(row, c)))),
        num(average(assignmentColumns.map((c) => valueOf(row, c)))),
        ...(showProgress ? [row.progress?.eligible ? "Memenuhi" : "Belum"] : []),
      ].join(";");
    });
    const csv = "﻿" + [header.map(escape).join(";"), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nilai-${batchName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const scoreTone = (value: number | null) =>
    value === null ? "text-isg-muted" : value < scoreTarget ? "text-isg-bad" : "text-isg-ink";

  const attendanceTone = (value: number | null) =>
    value === null
      ? "text-isg-muted"
      : value >= attendanceTarget
        ? "text-isg-ok"
        : "text-isg-warn";

  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-isg-line bg-isg-surface p-14 text-center">
        <Table2 size={30} aria-hidden className="text-isg-muted" />
        <p className="text-sm font-semibold text-isg-ink">Belum ada peserta</p>
        <p className="max-w-xs text-sm text-isg-muted">
          Peserta akan muncul setelah diverifikasi dan dimasukkan ke angkatan ini.
        </p>
      </div>
    );
  }

  const totalColumns = columns.length + 3 + (showProgress ? 2 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Bilah alat */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex w-full items-center sm:max-w-xs">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 text-isg-muted" />
          <span className="sr-only">Cari peserta</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau NIM..."
            className="h-11 w-full rounded-full border border-isg-line bg-isg-surface pl-10 pr-4 text-sm text-isg-ink outline-none transition-colors placeholder:text-isg-muted/70 focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {!canEdit ? (
            <span className="flex items-center gap-1.5 rounded-full bg-isg-tint px-3 py-2 text-xs font-bold text-isg-muted">
              <Lock size={13} aria-hidden />
              Hanya Admin yang dapat mengubah
            </span>
          ) : null}
          <button
            type="button"
            onClick={downloadCsv}
            className="flex h-11 items-center gap-2 rounded-full border border-isg-line bg-isg-surface px-4 text-sm font-bold text-isg-ink transition-colors hover:bg-isg-tint"
          >
            <Download size={15} aria-hidden />
            Unduh CSV
          </button>
        </div>
      </div>

      {canEdit ? (
        <p className="text-xs text-isg-muted">
          Ketuk sel untuk mengubah nilai (0–100). <Kbd>Enter</Kbd> atau <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> pindah baris, <Kbd>Esc</Kbd> batalkan perubahan sel. Perubahan
          baru tersimpan setelah kamu konfirmasi.
        </p>
      ) : null}

      {/* Tabel */}
      <div className="overflow-hidden rounded-card border border-isg-line bg-isg-surface">
        <div className="max-h-[68vh] overflow-auto overscroll-contain">
          <table
            ref={tableRef}
            className="w-max min-w-full border-separate border-spacing-0 text-sm"
          >
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 top-0 z-30 w-44 min-w-44 border-b border-r border-isg-line bg-isg-surface px-3 py-2 text-left align-bottom text-xs font-bold uppercase tracking-wide text-isg-muted sm:w-60 sm:min-w-60"
                >
                  Peserta
                  <span className="ml-1 font-medium normal-case tracking-normal">
                    ({rows.length})
                  </span>
                </th>
                {showProgress ? (
                  <th
                    rowSpan={2}
                    scope="col"
                    className="sticky top-0 z-20 w-24 min-w-24 border-b border-r border-isg-line bg-isg-surface px-2 py-2 text-center align-bottom text-xs font-bold text-isg-ink"
                  >
                    Kehadiran
                    <span className="mt-0.5 block text-[11px] font-normal text-isg-muted">
                      min. {attendanceTarget}%
                    </span>
                  </th>
                ) : null}
                {quizColumns.length ? (
                  <GroupHeader span={quizColumns.length} tone="blue">
                    Kuis
                  </GroupHeader>
                ) : null}
                {assignmentColumns.length ? (
                  <GroupHeader span={assignmentColumns.length} tone="mint">
                    Tugas
                  </GroupHeader>
                ) : null}
                <GroupHeader span={2} tone="ink">
                  Rata-rata
                </GroupHeader>
                {showProgress ? (
                  <th
                    rowSpan={2}
                    scope="col"
                    className="sticky top-0 z-20 w-28 min-w-28 border-b border-isg-line bg-isg-surface px-2 py-2 text-center align-bottom text-xs font-bold text-isg-ink"
                  >
                    Sertifikat
                  </th>
                ) : null}
              </tr>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    title={`${column.title} · ${column.dateLabel}`}
                    className="sticky top-8 z-20 w-28 min-w-28 max-w-28 border-b border-r border-isg-line bg-isg-surface px-2 py-2 text-center align-top font-normal"
                  >
                    <span
                      className={cn(
                        "block text-xs font-extrabold",
                        column.kind === "quiz" ? "text-isg-blue" : "text-isg-ok",
                      )}
                    >
                      {column.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight text-isg-ink-soft">
                      {column.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-isg-muted">
                      {column.dateLabel}
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="sticky top-8 z-20 w-20 min-w-20 border-b border-r border-isg-line bg-isg-tint px-2 py-2 text-center align-top text-xs font-bold text-isg-ink"
                >
                  Kuis
                </th>
                <th
                  scope="col"
                  className="sticky top-8 z-20 w-20 min-w-20 border-b border-isg-line bg-isg-tint px-2 py-2 text-center align-top text-xs font-bold text-isg-ink"
                >
                  Tugas
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-4 py-10 text-center text-sm text-isg-muted"
                  >
                    Tidak ada peserta yang cocok dengan &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              ) : null}

              {rows.map((row, rowIndex) => {
                const quizAvg = average(quizColumns.map((c) => valueOf(row, c)));
                const taskAvg = average(assignmentColumns.map((c) => valueOf(row, c)));
                return (
                  <tr key={row.participantId} className="group">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-b border-r border-isg-line bg-isg-surface px-3 py-2 text-left font-normal group-hover:bg-[#f6fafe]"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-isg-muted">
                          {data.rows.indexOf(row) + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-isg-ink">
                            {row.name}
                          </span>
                          <span className="block font-mono text-[11px] text-isg-muted">
                            {row.studentId}
                          </span>
                        </span>
                      </span>
                    </th>

                    {showProgress ? (
                      <td className="border-b border-r border-isg-line px-2 text-center tabular-nums group-hover:bg-[#f6fafe]">
                        <span
                          className={cn(
                            "block font-extrabold",
                            attendanceTone(row.progress?.attendancePercent ?? null),
                          )}
                        >
                          {row.progress?.attendancePercent === null ||
                          row.progress?.attendancePercent === undefined
                            ? "—"
                            : `${row.progress.attendancePercent}%`}
                        </span>
                        <span className="block text-[11px] text-isg-muted">
                          {row.progress?.attendanceLabel}
                        </span>
                      </td>
                    ) : null}

                    {columns.map((column, colIndex) => {
                      const key = cellKey(row.participantId, column.key);
                      const cell = row.cells[column.key];
                      const editable = canEdit && isCellEditable(column.kind, cell);
                      const isInvalid = invalid.has(key);
                      const isChanged = pendingKeys.has(key);
                      const shown = valueOf(row, column);

                      const placeholder =
                        cell?.state === "submitted"
                          ? "belum"
                          : cell?.state === "in_progress"
                            ? "proses"
                            : "—";

                      return (
                        <td
                          key={column.key}
                          title={
                            cell?.state === "submitted"
                              ? "Sudah dikumpulkan, belum dinilai"
                              : cell?.state === "in_progress"
                                ? "Sedang mengerjakan"
                                : !cell
                                  ? column.kind === "quiz"
                                    ? "Belum mengerjakan"
                                    : "Belum mengumpulkan"
                                  : undefined
                          }
                          className={cn(
                            "h-12 border-b border-r border-isg-line p-0 text-center tabular-nums group-hover:bg-[#f6fafe]",
                            isChanged && "bg-isg-warn/12 group-hover:bg-isg-warn/15",
                            isInvalid && "bg-isg-bad/10 group-hover:bg-isg-bad/10",
                            !editable && !cell && "bg-isg-tint/40",
                          )}
                        >
                          {editable ? (
                            <input
                              data-cell={`${rowIndex}-${colIndex}`}
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`Nilai ${row.name} untuk ${column.title}`}
                              aria-invalid={isInvalid || undefined}
                              value={key in drafts ? drafts[key] : formatScore(cell?.score ?? null)}
                              placeholder={placeholder}
                              onFocus={(event) => event.currentTarget.select()}
                              onChange={(event) => setDraft(key, event.target.value)}
                              onKeyDown={(event) => {
                                const input = event.currentTarget;
                                const atStart =
                                  input.selectionStart === 0 && input.selectionEnd === 0;
                                const atEnd =
                                  input.selectionStart === input.value.length &&
                                  input.selectionEnd === input.value.length;
                                if (event.key === "Enter" || event.key === "ArrowDown") {
                                  event.preventDefault();
                                  moveFocus(rowIndex, colIndex, event.shiftKey ? -1 : 1, 0);
                                } else if (event.key === "ArrowUp") {
                                  event.preventDefault();
                                  moveFocus(rowIndex, colIndex, -1, 0);
                                } else if (event.key === "ArrowLeft" && atStart) {
                                  event.preventDefault();
                                  moveFocus(rowIndex, colIndex, 0, -1);
                                } else if (event.key === "ArrowRight" && atEnd) {
                                  event.preventDefault();
                                  moveFocus(rowIndex, colIndex, 0, 1);
                                } else if (event.key === "Escape") {
                                  revertCell(key);
                                }
                              }}
                              className={cn(
                                "h-full w-full bg-transparent px-2 text-center font-semibold outline-none placeholder:text-xs placeholder:font-normal placeholder:text-isg-muted/70 focus:bg-isg-surface focus:ring-2 focus:ring-inset focus:ring-isg-blue",
                                isInvalid ? "text-isg-bad" : scoreTone(shown),
                              )}
                            />
                          ) : (
                            <span
                              className={cn(
                                "px-2 font-semibold",
                                shown === null ? "text-xs font-normal text-isg-muted/70" : scoreTone(shown),
                              )}
                            >
                              {shown === null ? placeholder : formatScore(shown)}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="border-b border-r border-isg-line bg-isg-tint/60 px-2 text-center font-extrabold tabular-nums">
                      <span className={scoreTone(quizAvg)}>{quizAvg ?? "—"}</span>
                    </td>
                    <td
                      className={cn(
                        "border-b border-isg-line bg-isg-tint/60 px-2 text-center font-extrabold tabular-nums",
                        showProgress && "border-r",
                      )}
                    >
                      <span className={scoreTone(taskAvg)}>{taskAvg ?? "—"}</span>
                    </td>
                    {showProgress ? (
                      <td className="border-b border-isg-line px-2 text-center group-hover:bg-[#f6fafe]">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            row.progress?.eligible
                              ? "bg-isg-ok/10 text-isg-ok"
                              : "bg-isg-tint text-isg-muted",
                          )}
                        >
                          {row.progress?.eligible ? "Memenuhi" : "Belum"}
                        </span>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>

            {rows.length > 0 ? (
              <tfoot>
                <tr>
                  <th
                    scope="row"
                    className="sticky bottom-0 left-0 z-20 border-r border-t border-isg-line bg-isg-tint px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-isg-muted"
                  >
                    Rata-rata kelas
                  </th>
                  {showProgress
                    ? (() => {
                        const avg = average(
                          rows.map((row) => row.progress?.attendancePercent ?? null),
                        );
                        return (
                          <td className="sticky bottom-0 z-10 border-r border-t border-isg-line bg-isg-tint px-2 py-2.5 text-center font-extrabold tabular-nums">
                            <span className={attendanceTone(avg)}>
                              {avg === null ? "—" : `${avg}%`}
                            </span>
                          </td>
                        );
                      })()
                    : null}
                  {columns.map((column) => {
                    const avg = average(rows.map((row) => valueOf(row, column)));
                    return (
                      <td
                        key={column.key}
                        className="sticky bottom-0 z-10 border-r border-t border-isg-line bg-isg-tint px-2 py-2.5 text-center font-extrabold tabular-nums"
                      >
                        <span className={scoreTone(avg)}>{avg ?? "—"}</span>
                      </td>
                    );
                  })}
                  {[quizColumns, assignmentColumns].map((group, index) => {
                    const avg = average(
                      rows.map((row) => average(group.map((c) => valueOf(row, c)))),
                    );
                    return (
                      <td
                        key={index}
                        className={cn(
                          "sticky bottom-0 z-10 border-t border-isg-line bg-isg-line/60 px-2 py-2.5 text-center font-extrabold tabular-nums",
                          (index === 0 || showProgress) && "border-r",
                        )}
                      >
                        <span className={scoreTone(avg)}>{avg ?? "—"}</span>
                      </td>
                    );
                  })}
                  {showProgress ? (
                    <td className="sticky bottom-0 z-10 border-t border-isg-line bg-isg-tint px-2 py-2.5 text-center text-xs font-bold text-isg-ink">
                      {rows.filter((row) => row.progress?.eligible).length}/{rows.length}
                    </td>
                  ) : null}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-isg-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-sm bg-isg-warn/30" />
          Diubah, belum disimpan
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="font-bold text-isg-bad">72</span>
          Di bawah {scoreTarget}
        </li>
        <li>
          <b className="font-semibold text-isg-ink-soft">belum</b> dikumpulkan, belum dinilai
        </li>
        <li>
          <b className="font-semibold text-isg-ink-soft">proses</b> sedang mengerjakan kuis
        </li>
        <li>
          <b className="font-semibold text-isg-ink-soft">—</b> belum mengerjakan
        </li>
      </ul>

      {/* Bilah simpan */}
      {canEdit && dirty ? (
        <div className="sticky bottom-3 z-30 mt-1 flex flex-col gap-3 rounded-card border border-isg-line bg-isg-surface/95 p-3 pl-5 shadow-pop backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-isg-ink">
            {pending.length} perubahan belum disimpan
            {invalid.size > 0 ? (
              <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-isg-bad">
                <CircleAlert size={13} aria-hidden />
                {invalid.size} sel tidak valid (harus 0–100; nilai kuis tidak boleh kosong)
              </span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrafts({})}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-isg-line px-4 text-sm font-bold text-isg-ink transition-colors hover:bg-isg-tint sm:flex-none"
            >
              <RotateCcw size={15} aria-hidden />
              Batalkan
            </button>
            <button
              type="button"
              disabled={pending.length === 0 || invalid.size > 0}
              onClick={() => {
                setSaveError("");
                setReviewing(true);
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-isg-blue px-5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Save size={15} aria-hidden />
              Simpan Perubahan
            </button>
          </div>
        </div>
      ) : null}

      {reviewing ? (
        <ReviewDialog
          changes={pending}
          saving={saving}
          error={saveError}
          onConfirm={confirmSave}
          onCancel={() => setReviewing(false)}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function GroupHeader({
  span,
  tone,
  children,
}: {
  span: number;
  tone: "blue" | "mint" | "ink";
  children: React.ReactNode;
}) {
  return (
    <th
      colSpan={span}
      scope="colgroup"
      className={cn(
        "sticky top-0 z-20 h-8 border-b border-r border-isg-line px-2 text-center text-[11px] font-extrabold uppercase tracking-wider last:border-r-0",
        tone === "blue" && "bg-isg-blue/8 text-isg-blue",
        tone === "mint" && "bg-isg-ok/8 text-isg-ok",
        tone === "ink" && "bg-isg-tint text-isg-ink-soft",
      )}
    >
      {children}
    </th>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded border border-isg-line bg-isg-surface px-1.5 py-0.5 font-sans text-[11px] font-semibold text-isg-ink-soft">
      {children}
    </kbd>
  );
}

function ReviewDialog({
  changes,
  saving,
  error,
  onConfirm,
  onCancel,
}: {
  changes: PendingChange[];
  saving: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const shown = changes.slice(0, 60);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) onCancel();
      }}
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        disabled={saving}
        className="absolute inset-0 bg-[#071A3D]/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-isg-surface shadow-xl sm:rounded-3xl"
      >
        <div className="border-b border-isg-line p-6 pb-4">
          <h2 id="review-title" className="text-lg font-extrabold text-isg-ink">
            Simpan {changes.length} perubahan nilai?
          </h2>
          <p className="mt-1 text-sm text-isg-muted">
            Periksa lagi sebelum menyimpan. Nilai baru langsung terlihat oleh peserta.
          </p>
        </div>

        <ul className="flex-1 divide-y divide-isg-line overflow-y-auto px-6">
          {shown.map((change) => (
            <li key={change.key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-isg-ink">{change.name}</p>
                <p className="truncate text-xs text-isg-muted">
                  {change.kind === "quiz" ? "Kuis" : "Tugas"} · {change.columnTitle}
                </p>
              </div>
              <p className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                <span className="text-isg-muted line-through decoration-isg-muted/60">
                  {change.before === null ? "kosong" : formatScore(change.before)}
                </span>
                <ArrowRight size={14} aria-hidden className="text-isg-muted" />
                <span className="rounded-md bg-isg-warn/15 px-2 py-0.5 font-extrabold text-isg-ink">
                  {change.score === null ? "kosong" : formatScore(change.score)}
                </span>
              </p>
            </li>
          ))}
          {changes.length > shown.length ? (
            <li className="py-3 text-center text-xs text-isg-muted">
              dan {changes.length - shown.length} perubahan lainnya
            </li>
          ) : null}
        </ul>

        <div className="flex flex-col gap-3 border-t border-isg-line p-6 pt-4">
          {error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-isg-bad">
              <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 rounded-full border border-isg-line px-5 text-sm font-bold text-isg-ink hover:bg-isg-tint disabled:opacity-60"
            >
              Periksa lagi
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              autoFocus
              className="flex h-11 items-center gap-2 rounded-full bg-isg-blue px-5 text-sm font-bold text-white hover:bg-isg-blue-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <Save size={15} aria-hidden />}
              {saving ? "Menyimpan..." : "Ya, simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
