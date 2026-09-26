/*
  Warnings:

  - A unique constraint covering the columns `[season,round]` on the table `Race` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Race_season_round_key" ON "Race"("season", "round");
