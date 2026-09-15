import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  identifier: z.string().min(1, "Email atau NIM wajib diisi."),
  password: z.string().min(1),
});

// Staf (Admin/Mentor/Co-Mentor/Advisor) login pakai email.
// Peserta login pakai NIM (nomor induk mahasiswa).
async function findUserByIdentifier(identifier: string) {
  if (identifier.includes("@")) {
    return prisma.user.findUnique({ where: { email: identifier } });
  }

  const participant = await prisma.participantProfile.findUnique({
    where: { studentId: identifier },
    include: { user: true },
  });
  return participant?.user ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Tanpa ini Auth.js menolak request di build produksi ("UntrustedHost") kecuali
  // dideploy di Vercel — login jadi 500 di `next start`, VPS, atau Docker.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email atau NIM" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        // Kegagalan database dibedakan dari "user tidak ditemukan": yang pertama
        // harus dilempar supaya pengguna diberi tahu servernya bermasalah, bukan
        // disamarkan jadi "kata sandi salah".
        let user;
        try {
          user = await findUserByIdentifier(parsed.data.identifier);
        } catch (error) {
          console.error("[auth] gagal membaca user dari database:", error);
          throw new Error("DATABASE_UNAVAILABLE");
        }

        if (!user) return null;

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!passwordMatches) return null;

        // Hanya akun yang sudah diverifikasi admin yang boleh login.
        if (user.status !== "VERIFIED") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
});
