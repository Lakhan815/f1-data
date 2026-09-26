/*
  Warnings:

  - A unique constraint covering the columns `[driverId,raceId]` on the table `RaceResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_driverId_raceId_key" ON "RaceResult"("driverId", "raceId");
