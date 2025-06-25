/*
  Warnings:

  - You are about to alter the column `price` on the `ShopItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "currency" SET DEFAULT 'emeralds';
