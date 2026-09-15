import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  PasswordForm,
  ProfileForm,
} from "@/features/profile/components/ProfileForm";
import { ROLE_LABEL, ROLE_TONE } from "@/features/accounts/types";
import { formatDateID } from "@/utils/format-date";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const session = await auth();
  const user = requireRole(session, [
    "ADMIN",
    "MENTOR",
    "CO_MENTOR",
    "ADVISOR",
    "PARTICIPANT",
  ]);

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      bio: true,
      photoUrl: true,
      role: true,
      position: true,
      createdAt: true,
      participantProfile: {
        select: {
          registrationNumber: true,
          studentId: true,
          semester: true,
          techInterests: true,
          batch: { select: { name: true, period: true } },
        },
      },
    },
  });

  if (!me) return null;

  const p = me.participantProfile;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-isg-ink">Profil</h1>
        <p className="text-sm text-isg-muted">
          Kelola data dirimu dan kata sandi akun.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <ProfileForm
            initial={{
              name: me.name,
              phone: me.phone ?? "",
              bio: me.bio ?? "",
              photoUrl: me.photoUrl ?? "",
            }}
          />
          <PasswordForm />
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-isg-line bg-isg-surface p-5 lg:p-6">
          <h2 className="text-base font-extrabold text-isg-ink">Informasi Akun</h2>

          <dl className="flex flex-col gap-3.5 text-sm">
            <Row label="Email">
              <span className="break-all font-semibold text-isg-ink">{me.email}</span>
            </Row>
            <Row label="Peran">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  ROLE_TONE[me.role],
                )}
              >
                {ROLE_LABEL[me.role]}
              </span>
            </Row>
            {me.position ? (
              <Row label="Jabatan">
                <span className="font-semibold text-isg-ink">{me.position}</span>
              </Row>
            ) : null}
            {p ? (
              <>
                <Row label="No. Pendaftaran">
                  <span className="font-mono text-xs font-semibold text-isg-ink">
                    {p.registrationNumber}
                  </span>
                </Row>
                <Row label="NIM">
                  <span className="font-mono text-xs font-semibold text-isg-ink">
                    {p.studentId}
                  </span>
                </Row>
                <Row label="Semester">
                  <span className="font-semibold text-isg-ink">Semester {p.semester}</span>
                </Row>
                <Row label="Angkatan">
                  <span className="font-semibold text-isg-ink">
                    {p.batch ? `${p.batch.name} · ${p.batch.period}` : "Belum ditentukan"}
                  </span>
                </Row>
              </>
            ) : null}
            <Row label="Bergabung">
              <span className="font-semibold text-isg-ink">
                {formatDateID(me.createdAt)}
              </span>
            </Row>
          </dl>

          {p && p.techInterests.length > 0 ? (
            <div className="border-t border-isg-line pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-isg-muted">
                Minat Teknologi
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.techInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-isg-tint px-2.5 py-1 text-xs font-semibold text-isg-ink-soft"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <p className="border-t border-isg-line pt-4 text-xs text-isg-muted">
            Email, NIM, dan angkatan hanya bisa diubah oleh Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-isg-muted">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
