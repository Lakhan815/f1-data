/*
  Warnings:

  - A unique constraint covering the columns `[season,round,sessionType]` on the table `Race` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Race_season_round_key";

-- CreateIndex
CREATE UNIQUE INDEX "Race_season_round_sessionType_key" ON "Race"("season", "round", "sessionType");
