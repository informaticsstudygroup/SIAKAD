import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL ?? "";

// Postgres lokal (docker, dev) tidak melayani TLS, jadi SSL hanya dinyalakan
// untuk host non-lokal. Sebelumnya SSL selalu aktif dan koneksi ke localhost
// selalu ditolak.
const isLocalDatabase = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);

const adapter = new PrismaPg({
  connectionString,
  // Supabase pooler memakai sertifikat yang tidak selalu ada di trust store
  // lokal/serverless — verifikasi rantai dimatikan, koneksi tetap terenkripsi.
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
