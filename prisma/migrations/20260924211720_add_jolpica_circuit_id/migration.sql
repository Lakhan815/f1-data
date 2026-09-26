/*
  Warnings:

  - A unique constraint covering the columns `[jolpicaDriverId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jolpicaConstructorId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jolpicaDriverId` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jolpicaConstructorId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "jolpicaDriverId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "jolpicaConstructorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_jolpicaDriverId_key" ON "Driver"("jolpicaDriverId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_jolpicaConstructorId_key" ON "Team"("jolpicaConstructorId");
