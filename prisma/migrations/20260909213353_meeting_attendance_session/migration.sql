-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "attendanceOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attendanceOpenedAt" TIMESTAMP(3);
