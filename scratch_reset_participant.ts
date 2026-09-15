import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const participant = await prisma.participantProfile.findFirst({
    where: { studentId: "24013025" },
    include: { user: true },
  });

  if (!participant) {
    console.log("Participant 24013025 tidak ditemukan.");
    return;
  }

  await prisma.user.update({
    where: { id: participant.userId },
    data: { status: "PENDING" },
  });

  console.log(`Status user ${participant.user.name} (${participant.studentId}) berhasil direset ke PENDING.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
