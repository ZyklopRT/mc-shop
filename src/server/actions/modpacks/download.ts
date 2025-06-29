"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { ModpackDownloadSchema } from "~/lib/validations/modpack";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { headers } from "next/headers";

// Standard action result type
type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Directory paths (currently unused but ready for future enhancements)
// const MODPACK_ROOT =
//   process.env.MODPACK_STORAGE_PATH ??
//   path.join(process.cwd(), "data", "modpacks");

/**
 * Get modpack by ID for download validation
 */
async function getModpackForDownload(modpackId: string) {
  const modpack = await db.modpack.findUnique({
    where: { id: modpackId },
    select: {
      id: true,
      name: true,
      version: true,
      filePath: true,
      fileSize: true,
      isPublic: true,
      isActive: true,
    },
  });

  return modpack;
}

/**
 * Get latest version of a modpack by name
 */
async function getLatestModpackForDownload(modpackName: string) {
  const latestModpack = await db.modpack.findFirst({
    where: {
      name: modpackName,
      isPublic: true,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      version: true,
      filePath: true,
      fileSize: true,
      isPublic: true,
      isActive: true,
    },
    orderBy: { releaseDate: "desc" },
  });

  return latestModpack;
}

/**
 * Extract mods folder from modpack ZIP file
 */
async function extractModsFolder(zipFilePath: string): Promise<Buffer> {
  try {
    // Read the stored ZIP file
    const fullZipPath = path.join(process.cwd(), zipFilePath);
    const zipBuffer = await fs.readFile(fullZipPath);

    // Open the ZIP file
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Create a new ZIP with just the mods folder
    const modsZip = new AdmZip();

    // Find all entries in the mods folder
    const modEntries = entries.filter(
      (entry) =>
        entry.entryName.includes("mods/") &&
        entry.entryName.endsWith(".jar") &&
        !entry.isDirectory,
    );

    if (modEntries.length === 0) {
      throw new Error("No mods found in modpack");
    }

    // Add each mod file to the new ZIP, preserving just the filename
    for (const entry of modEntries) {
      const fileName = path.basename(entry.entryName);
      modsZip.addFile(`mods/${fileName}`, entry.getData());
    }

    return modsZip.toBuffer();
  } catch (error) {
    console.error("Error extracting mods folder:", error);
    throw new Error("Failed to extract mods from modpack");
  }
}

/**
 * Record download in database for analytics
 */
async function recordDownload(
  modpackId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    const session = await auth();

    // Increment download count and record download
    await db.$transaction([
      db.modpack.update({
        where: { id: modpackId },
        data: { downloadCount: { increment: 1 } },
      }),
      db.modpackDownload.create({
        data: {
          modpackId,
          userId: session?.user?.id,
          ipAddress: ipAddress ?? "unknown",
          userAgent: userAgent ?? "unknown",
          completed: true,
        },
      }),
    ]);
  } catch (error) {
    console.error("Error recording download:", error);
    // Don't fail the download if analytics fail
  }
}

/**
 * Download a specific modpack version
 */
export async function downloadModpack(
  modpackId: string,
): Promise<ActionResult<{ fileName: string; modsZipBuffer: Buffer }>> {
  try {
    // Validate input
    const validatedData = ModpackDownloadSchema.parse({ modpackId });

    // Get modpack details
    const modpack = await getModpackForDownload(validatedData.modpackId);
    if (!modpack) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    // Check if modpack is public and active
    if (!modpack.isPublic || !modpack.isActive) {
      return {
        success: false,
        error: "Modpack is not available for download",
      };
    }

    // Extract mods folder from ZIP
    const modsZipBuffer = await extractModsFolder(modpack.filePath);

    // Get client info for analytics
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    // Record download
    await recordDownload(modpack.id, ipAddress, userAgent);

    // Generate filename
    const fileName = `${modpack.name}-${modpack.version}-mods.zip`;

    return {
      success: true,
      data: {
        fileName,
        modsZipBuffer,
      },
    };
  } catch (error) {
    console.error("Error downloading modpack:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to download modpack",
    };
  }
}

/**
 * Download latest version of a modpack by name
 */
export async function downloadLatestModpack(
  modpackName: string,
): Promise<ActionResult<{ fileName: string; modsZipBuffer: Buffer }>> {
  try {
    // Get latest version of the modpack
    const modpack = await getLatestModpackForDownload(modpackName);
    if (!modpack) {
      return {
        success: false,
        error: "Modpack not found or no public versions available",
      };
    }

    // Use the specific version download function
    return await downloadModpack(modpack.id);
  } catch (error) {
    console.error("Error downloading latest modpack:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to download latest modpack",
    };
  }
}
