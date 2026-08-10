import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function seedAdmin() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@isg.dev" },
    update: {},
    create: {
      name: "Admin ISG",
      email: "admin@isg.dev",
      passwordHash,
      role: "ADMIN",
      status: "VERIFIED",
    },
  });

  console.log("Seeded admin user:", admin.email);
}

async function seedParticipant() {
  const nim = process.env.SEED_PARTICIPANT_NIM;
  const password = process.env.SEED_PARTICIPANT_PASSWORD;

  if (!nim || !password) {
    console.log(
      "Lewati seed peserta: SEED_PARTICIPANT_NIM / SEED_PARTICIPANT_PASSWORD belum diisi di .env",
    );
    return;
  }

  const name = process.env.SEED_PARTICIPANT_NAME ?? "Peserta ISG";
  const email = process.env.SEED_PARTICIPANT_EMAIL ?? `${nim}@isg.dev`;
  const studyProgram = process.env.SEED_PARTICIPANT_STUDY_PROGRAM ?? "Informatika";
  const semester = Number(process.env.SEED_PARTICIPANT_SEMESTER ?? 3);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: "PARTICIPANT",
      status: "VERIFIED",
    },
  });

  const participant = await prisma.participantProfile.upsert({
    where: { userId: user.id },
    update: { studentId: nim },
    create: {
      userId: user.id,
      registrationNumber: `REG-${nim}`,
      studentId: nim,
      studyProgram,
      semester,
      techInterests: [],
    },
  });

  console.log("Seeded participant user:", user.email, "NIM:", participant.studentId);
}

async function main() {
  await seedAdmin();
  await seedParticipant();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
