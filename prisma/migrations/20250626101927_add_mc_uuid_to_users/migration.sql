/*
  Warnings:

  - A unique constraint covering the columns `[mcUUID]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mcUUID" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_mcUUID_key" ON "User"("mcUUID");
