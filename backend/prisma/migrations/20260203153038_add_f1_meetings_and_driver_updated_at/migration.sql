/*
  Warnings:

  - Added the required column `updatedAt` to the `f1_drivers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "f1_drivers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "f1_meetings" (
    "id" TEXT NOT NULL,
    "meetingKey" INTEGER NOT NULL,
    "meetingName" TEXT NOT NULL,
    "officialName" TEXT,
    "location" TEXT,
    "countryCode" TEXT,
    "countryName" TEXT,
    "circuitShortName" TEXT,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "f1_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "f1_meetings_meetingKey_key" ON "f1_meetings"("meetingKey");

-- CreateIndex
CREATE INDEX "f1_meetings_year_dateStart_idx" ON "f1_meetings"("year", "dateStart");
