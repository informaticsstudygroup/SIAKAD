import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PasswordForm } from "@/features/profile/components/ProfileForm";

export const metadata: Metadata = {
  title: "Buat Kata Sandi Baru",
};

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-isg-bg px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-isg-line bg-isg-surface p-7 shadow-pop sm:p-9">
        <p className="text-xs font-bold uppercase tracking-widest text-isg-blue">Akun siap digunakan</p>
        <h1 className="mt-2 text-2xl font-extrabold text-isg-ink">Buat kata sandi baru</h1>
        <p className="mt-2 text-sm leading-relaxed text-isg-muted">
          Demi keamanan, ganti kata sandi sementara yang dikirim admin sebelum masuk ke portal.
        </p>
        <div className="mt-7">
          <PasswordForm redirectTo="/dashboard" />
        </div>
        <Link href="/login" className="mt-5 block text-center text-sm font-bold text-isg-blue hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}