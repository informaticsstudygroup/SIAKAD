/**
 * Memperbaiki jadwal, kuis, dan tugas yang tersimpan 8 jam terlalu lambat.
 *
 * Sebelum src/lib/time.ts ada, server membaca jam dari form memakai zona
 * waktu server. Di Railway (UTC), pertemuan jam 19:00 tersimpan sebagai
 * 19:00 UTC = 03:00 WITA keesokan harinya. Data yang dibuat dari laptop
 * (zona WITA) tersimpan benar, jadi tidak semua data boleh digeser: pilih
 * sendiri lewat kodenya.
 *
 *   npx tsx prisma/geser-zona-waktu.ts                     daftar saja
 *   npx tsx prisma/geser-zona-waktu.ts --geser J1,K2,T3    pratinjau
 *   npx tsx prisma/geser-zona-waktu.ts --geser J1,K2 --ya  simpan
 *
 * Kode: J = jadwal pertemuan, K = kuis, T = tugas. Kode diurutkan menurut
 * waktu dibuat, jadi data baru selalu mendapat nomor di belakang.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { formatLocal, localParts } from "../src/lib/time";

const SHIFT_MS = 8 * 60 * 60 * 1000;

type Item = {
  code: string;
  kind: "meeting" | "quiz" | "assignment";
  id: string;
  title: string;
  createdAt: Date;
  /** Waktu-waktu yang ikut digeser, dengan nama kolomnya. */
  times: Record<string, Date>;
};

const fmt = (d: Date) =>
  formatLocal(d, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Jam 00:00–07:59 WITA jarang dipakai untuk kegiatan: kemungkinan besar data yang bergeser. */
function looksShifted(d: Date) {
  return localParts(d).hour < 8;
}

async function loadItems(): Promise<Item[]> {
  const [meetings, quizzes, assignments] = await Promise.all([
    prisma.meeting.findMany({
      select: { id: true, title: true, createdAt: true, date: true, startTime: true, endTime: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.quiz.findMany({
      select: { id: true, title: true, createdAt: true, startAt: true, endAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.assignment.findMany({
      select: { id: true, title: true, createdAt: true, deadline: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);

  return [
    ...meetings.map((m, i) => ({
      code: `J${i + 1}`,
      kind: "meeting" as const,
      id: m.id,
      title: m.title,
      createdAt: m.createdAt,
      times: { date: m.date, startTime: m.startTime, endTime: m.endTime },
    })),
    ...quizzes.map((q, i) => ({
      code: `K${i + 1}`,
      kind: "quiz" as const,
      id: q.id,
      title: q.title,
      createdAt: q.createdAt,
      times: { startAt: q.startAt, endAt: q.endAt },
    })),
    ...assignments.map((a, i) => ({
      code: `T${i + 1}`,
      kind: "assignment" as const,
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
      times: { deadline: a.deadline },
    })),
  ];
}

function mainTime(item: Item) {
  return item.times.startTime ?? item.times.startAt ?? item.times.deadline;
}

function printItem(item: Item, withShift: boolean) {
  const main = mainTime(item);
  const flag = looksShifted(main) ? " ⚠ jam tidak wajar" : "";
  console.log(`${item.code.padEnd(5)} ${item.title}`);
  console.log(`      dibuat      : ${fmt(item.createdAt)}`);
  for (const [field, value] of Object.entries(item.times)) {
    if (field === "date") continue; // sama dengan startTime
    const label = { startTime: "mulai", endTime: "selesai", startAt: "buka", endAt: "tutup", deadline: "tenggat" }[field] ?? field;
    const now = `${label.padEnd(11)} : ${fmt(value)}`;
    const after = withShift ? `  →  ${fmt(new Date(value.getTime() - SHIFT_MS))}` : "";
    console.log(`      ${now}${after}${field === Object.keys(item.times).find((k) => k !== "date") ? flag : ""}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const geserIndex = args.indexOf("--geser");
  const confirmed = args.includes("--ya");
  const items = await loadItems();

  if (geserIndex === -1) {
    console.log("Semua jam ditampilkan dalam WITA.\n");
    for (const item of items) printItem(item, true);
    const suspicious = items.filter((i) => looksShifted(mainTime(i))).map((i) => i.code);
    console.log(`\n${items.length} data. Jam tidak wajar (00:00–07:59): ${suspicious.join(",") || "tidak ada"}`);
    console.log("Pratinjau: npx tsx prisma/geser-zona-waktu.ts --geser KODE1,KODE2");
    return;
  }

  const codes = (args[geserIndex + 1] ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  const chosen = items.filter((i) => codes.includes(i.code));
  const unknown = codes.filter((c) => !items.some((i) => i.code === c));
  if (unknown.length) {
    console.error(`Kode tidak dikenal: ${unknown.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  if (chosen.length === 0) {
    console.error("Tidak ada kode yang dipilih.");
    process.exitCode = 1;
    return;
  }

  console.log(`Akan digeser 8 jam lebih awal (${chosen.length} data):\n`);
  for (const item of chosen) printItem(item, true);

  if (!confirmed) {
    console.log("\nBelum ada yang diubah. Tambahkan --ya untuk menyimpan.");
    return;
  }

  const shift = (d: Date) => new Date(d.getTime() - SHIFT_MS);
  await prisma.$transaction(
    chosen.map((item) => {
      const data = Object.fromEntries(
        Object.entries(item.times).map(([field, value]) => [field, shift(value)]),
      );
      if (item.kind === "meeting") return prisma.meeting.update({ where: { id: item.id }, data });
      if (item.kind === "quiz") return prisma.quiz.update({ where: { id: item.id }, data });
      return prisma.assignment.update({ where: { id: item.id }, data });
    }),
  );
  console.log(`\nSelesai: ${chosen.length} data digeser.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
