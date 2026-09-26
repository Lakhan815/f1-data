/*
  Warnings:

  - A unique constraint covering the columns `[jolpicaCircuitId]` on the table `Circuit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jolpicaCircuitId` to the `Circuit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Circuit" ADD COLUMN     "jolpicaCircuitId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Circuit_jolpicaCircuitId_key" ON "Circuit"("jolpicaCircuitId");
