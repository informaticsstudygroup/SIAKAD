"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Power, Search, UserRound } from "lucide-react";
import { AccountFormDrawer } from "@/features/accounts/components/AccountFormDrawer";
import { setAccountStatus } from "@/features/accounts/actions/account-actions";
import {
  ROLE_LABEL,
  ROLE_TONE,
  type AccountRow,
} from "@/features/accounts/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateID } from "@/utils/format-date";
import { cn } from "@/utils/cn";

const ROLE_FILTERS = [
  { value: "ALL", label: "Semua" },
  { value: "ADMIN", label: "Admin" },
  { value: "MENTOR", label: "Mentor" },
  { value: "CO_MENTOR", label: "Co-Mentor" },
  { value: "ADVISOR", label: "Advisor" },
  { value: "PARTICIPANT", label: "Peserta" },
];

export function AccountManager({
  accounts,
  currentRole,
  query,
  currentUserId,
}: {
  accounts: AccountRow[];
  currentRole: string;
  query: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<AccountRow | null>(null);
  const [toggleError, setToggleError] = useState("");
  const [isToggling, setIsToggling] = useState(false);

  function pushParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== "ALL") params.set(key, value);
      else params.delete(key);
    });
    startTransition(() => router.push(`/dashboard/akun?${params.toString()}`));
  }

  async function confirmToggle() {
    if (!toggling) return;
    setIsToggling(true);
    setToggleError("");
    const nextStatus = toggling.status === "DISABLED" ? "VERIFIED" : "DISABLED";
    const result = await setAccountStatus(toggling.id, nextStatus);
    setIsToggling(false);
    if (result.error) {
      setToggleError(result.error);
      return;
    }
    setToggling(null);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">
            Manajemen Akun
          </h1>
          <p className="text-sm text-isg-muted">
            {accounts.length} akun ditampilkan. Akun peserta dibuat lewat pendaftaran.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-fit items-center gap-2 rounded-full bg-isg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lift transition-colors hover:bg-isg-blue-deep"
        >
          <Plus size={16} aria-hidden />
          Tambah Akun Staf
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((filter) => {
            const active = currentRole === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => pushParams({ role: filter.value })}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-isg-ink text-white"
                    : "border border-isg-line bg-isg-surface text-isg-ink-soft hover:border-isg-blue/40",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <form
          className="relative w-full lg:w-72"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q");
            pushParams({ q: String(value ?? "") });
          }}
        >
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-isg-muted"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Cari nama atau email..."
            className="h-11 w-full rounded-full border border-isg-line bg-isg-surface pl-10 pr-4 text-sm text-isg-ink outline-none focus:border-isg-blue focus:ring-4 focus:ring-isg-blue/15"
          />
        </form>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-card border border-isg-line bg-isg-surface transition-opacity",
          isPending && "opacity-60",
        )}
      >
        {accounts.length === 0 ? (
          <p className="p-10 text-center text-sm text-isg-muted">
            Tidak ada akun yang cocok dengan filter ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-isg-line">
                  <Th>Akun</Th>
                  <Th>Peran</Th>
                  <Th>Jabatan / NIM</Th>
                  <Th>Status</Th>
                  <Th>Dibuat</Th>
                  <Th align="right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const isSelf = account.id === currentUserId;
                  const disabled = account.status === "DISABLED";
                  return (
                    <tr
                      key={account.id}
                      className="border-b border-isg-line last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-isg-tint ring-1 ring-isg-line">
                            {account.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- data URL
                              <img
                                src={account.photoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-isg-muted">
                                <UserRound size={16} aria-hidden />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-isg-ink">
                              {account.name}
                              {isSelf ? (
                                <span className="ml-2 text-xs font-medium text-isg-muted">
                                  (kamu)
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-isg-muted">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            ROLE_TONE[account.role],
                          )}
                        >
                          {ROLE_LABEL[account.role]}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-isg-ink-soft">
                        {account.role === "PARTICIPANT"
                          ? (account.participantProfile?.studentId ?? "-")
                          : (account.position ?? "-")}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                            disabled
                              ? "bg-isg-bad/10 text-isg-bad"
                              : account.status === "VERIFIED"
                                ? "bg-isg-ok/10 text-isg-ok"
                                : "bg-isg-warn/10 text-isg-warn",
                          )}
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-current"
                          />
                          {disabled
                            ? "Nonaktif"
                            : account.status === "VERIFIED"
                              ? "Aktif"
                              : "Menunggu"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-isg-muted">
                        {formatDateID(account.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(account)}
                            aria-label={`Ubah akun ${account.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-isg-muted transition-colors hover:bg-isg-tint hover:text-isg-blue"
                          >
                            <Pencil size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => {
                              setToggleError("");
                              setToggling(account);
                            }}
                            aria-label={`${disabled ? "Aktifkan" : "Nonaktifkan"} akun ${account.name}`}
                            title={
                              isSelf
                                ? "Kamu tidak bisa menonaktifkan akunmu sendiri"
                                : undefined
                            }
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                              isSelf
                                ? "cursor-not-allowed text-isg-line"
                                : disabled
                                  ? "text-isg-muted hover:bg-isg-ok/10 hover:text-isg-ok"
                                  : "text-isg-muted hover:bg-isg-bad/10 hover:text-isg-bad",
                            )}
                          >
                            <Power size={16} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <AccountFormDrawer account={null} onClose={() => setCreating(false)} />
      ) : null}

      {editing ? (
        <AccountFormDrawer account={editing} onClose={() => setEditing(null)} />
      ) : null}

      {toggling ? (
        <ConfirmDialog
          title={
            toggling.status === "DISABLED" ? "Aktifkan akun?" : "Nonaktifkan akun?"
          }
          description={
            toggling.status === "DISABLED"
              ? `${toggling.name} akan bisa masuk kembali ke Informatics Study Group SIAKAD.`
              : `${toggling.name} tidak akan bisa masuk lagi sampai diaktifkan kembali.`
          }
          confirmLabel={
            toggling.status === "DISABLED" ? "Aktifkan" : "Nonaktifkan"
          }
          isDanger={toggling.status !== "DISABLED"}
          isPending={isToggling}
          error={toggleError}
          onConfirm={confirmToggle}
          onCancel={() => setToggling(null)}
        />
      ) : null}
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-bold uppercase tracking-wide text-isg-muted",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}
