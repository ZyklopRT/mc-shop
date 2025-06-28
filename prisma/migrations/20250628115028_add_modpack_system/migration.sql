-- CreateEnum
CREATE TYPE "ModLoader" AS ENUM ('NEOFORGE', 'FORGE', 'FABRIC', 'QUILT', 'VANILLA');

-- CreateEnum
CREATE TYPE "ModSide" AS ENUM ('CLIENT', 'SERVER', 'BOTH');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'UPDATED', 'REMOVED', 'UNCHANGED');

-- CreateEnum
CREATE TYPE "ChangeImpact" AS ENUM ('MAJOR', 'MINOR', 'PATCH');

-- CreateTable
CREATE TABLE "Modpack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "minecraftVersion" TEXT NOT NULL DEFAULT '1.21',
    "modLoader" "ModLoader" NOT NULL DEFAULT 'NEOFORGE',
    "modLoaderVersion" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "releaseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Modpack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mod" (
    "id" TEXT NOT NULL,
    "modId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "version" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "homepage" TEXT,
    "logoPath" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "modLoader" "ModLoader" NOT NULL DEFAULT 'NEOFORGE',
    "modLoaderVersion" TEXT,
    "minecraftVersion" TEXT,
    "side" "ModSide" NOT NULL DEFAULT 'BOTH',
    "dependencies" JSONB,
    "modpackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModpackChangelog" (
    "id" TEXT NOT NULL,
    "modpackId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "modId" TEXT NOT NULL,
    "modName" TEXT NOT NULL,
    "oldVersion" TEXT,
    "newVersion" TEXT,
    "description" TEXT,
    "impact" "ChangeImpact" NOT NULL DEFAULT 'MINOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModpackChangelog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModpackDownload" (
    "id" TEXT NOT NULL,
    "modpackId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ModpackDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Modpack_isActive_isFeatured_idx" ON "Modpack"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "Modpack_modLoader_minecraftVersion_idx" ON "Modpack"("modLoader", "minecraftVersion");

-- CreateIndex
CREATE INDEX "Modpack_createdById_idx" ON "Modpack"("createdById");

-- CreateIndex
CREATE INDEX "Modpack_releaseDate_idx" ON "Modpack"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Modpack_name_version_key" ON "Modpack"("name", "version");

-- CreateIndex
CREATE INDEX "Mod_modpackId_modId_idx" ON "Mod"("modpackId", "modId");

-- CreateIndex
CREATE INDEX "Mod_modLoader_minecraftVersion_idx" ON "Mod"("modLoader", "minecraftVersion");

-- CreateIndex
CREATE INDEX "Mod_modpackId_idx" ON "Mod"("modpackId");

-- CreateIndex
CREATE INDEX "ModpackChangelog_modpackId_changeType_idx" ON "ModpackChangelog"("modpackId", "changeType");

-- CreateIndex
CREATE INDEX "ModpackChangelog_modpackId_idx" ON "ModpackChangelog"("modpackId");

-- CreateIndex
CREATE INDEX "ModpackDownload_modpackId_downloadedAt_idx" ON "ModpackDownload"("modpackId", "downloadedAt");

-- CreateIndex
CREATE INDEX "ModpackDownload_modpackId_idx" ON "ModpackDownload"("modpackId");

-- AddForeignKey
ALTER TABLE "Modpack" ADD CONSTRAINT "Modpack_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mod" ADD CONSTRAINT "Mod_modpackId_fkey" FOREIGN KEY ("modpackId") REFERENCES "Modpack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModpackChangelog" ADD CONSTRAINT "ModpackChangelog_modpackId_fkey" FOREIGN KEY ("modpackId") REFERENCES "Modpack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModpackDownload" ADD CONSTRAINT "ModpackDownload_modpackId_fkey" FOREIGN KEY ("modpackId") REFERENCES "Modpack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModpackDownload" ADD CONSTRAINT "ModpackDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
