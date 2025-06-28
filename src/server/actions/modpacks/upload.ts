"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { requireAdmin } from "~/lib/utils/admin-utils";
import { ModpackUploadSchema, type ModLoader } from "~/lib/validations/modpack";
import AdmZip from "adm-zip";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import toml from "toml";

// Types for upload result
interface UploadResult {
  success: boolean;
  error?: string;
  data?: {
    modpackId: string;
    modsFound: number;
  };
  details?: {
    errors: string[];
  };
}

// Types for mod metadata
interface ModMetadata {
  modId: string;
  name: string;
  displayName?: string;
  version: string;
  author?: string;
  description?: string;
  homepage?: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  modLoader: ModLoader;
  modLoaderVersion?: string;
  minecraftVersion?: string;
  side: "CLIENT" | "SERVER" | "BOTH";
  dependencies?: unknown; // JSON field in Prisma
  logoPath?: string;
}

// Directory paths
const MODPACK_ROOT =
  process.env.MODPACK_STORAGE_PATH ??
  path.join(process.cwd(), "data", "modpacks");
const UPLOADS_DIR = path.join(MODPACK_ROOT, "uploads");
const VERSIONS_DIR = path.join(MODPACK_ROOT, "versions");
const PUBLIC_LOGOS_DIR = path.join(
  process.cwd(),
  "public",
  "modpacks",
  "logos",
);

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_LOGOS_DIR, { recursive: true });
}

// Generate file checksum
function generateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Extract metadata from NeoForge mod JAR using toml parser
async function extractNeoForgeMetadata(
  jarBuffer: Buffer,
  fileName: string,
): Promise<ModMetadata | null> {
  try {
    const zip = new AdmZip(jarBuffer);

    // Try neoforge.mods.toml first (NeoForge 1.21+)
    let metadataEntry = zip.getEntry("META-INF/neoforge.mods.toml");
    let modLoader: ModLoader = "NEOFORGE";

    // Fallback to mods.toml (legacy Forge)
    if (!metadataEntry) {
      metadataEntry = zip.getEntry("META-INF/mods.toml");
      modLoader = "FORGE";
    }

    if (!metadataEntry) {
      return null; // Not a recognized mod format
    }

    const tomlContent = metadataEntry.getData().toString("utf8");
    const parsedUnknown: unknown = toml.parse(tomlContent);
    let modMeta: Record<string, unknown> = {};
    if (typeof parsedUnknown === "object" && parsedUnknown !== null) {
      const parsed = parsedUnknown as Record<string, unknown>;
      if (Array.isArray(parsed.mods)) {
        const firstMod = parsed.mods[0];
        if (typeof firstMod === "object" && firstMod !== null) {
          modMeta = firstMod as Record<string, unknown>;
        }
      } else if (parsed.mods && typeof parsed.mods === "object") {
        modMeta = parsed.mods as Record<string, unknown>;
      }
    }

    // Extract logo if present
    let logoPath: string | undefined;
    const logoEntry = zip.getEntry("logo.png") ?? zip.getEntry("icon.png");
    if (logoEntry) {
      const logoFileName = `${typeof modMeta.modId === "string" ? modMeta.modId : fileName.replace(".jar", "")}.png`;
      const fullLogoPath = path.join(PUBLIC_LOGOS_DIR, logoFileName);
      await fs.writeFile(fullLogoPath, logoEntry.getData());
      logoPath = `/modpacks/logos/${logoFileName}`; // Web-accessible path
    }

    // Debug logging for logo extraction
    console.log(
      `[MOD UPLOAD] fileName=${fileName} modId=${typeof modMeta.modId === "string" ? modMeta.modId : ""} logoPath=${logoPath}`,
    );

    // Handle authors/author as string or array
    let author = "";
    if (Array.isArray(modMeta.authors)) {
      author = (modMeta.authors as string[]).join(", ");
    } else if (typeof modMeta.authors === "string") {
      author = modMeta.authors;
    } else if (typeof modMeta.author === "string") {
      author = modMeta.author;
    }

    // Handle description as string or array
    let description = "";
    if (Array.isArray(modMeta.description)) {
      description = (modMeta.description as string[]).join("\n");
    } else if (typeof modMeta.description === "string") {
      description = modMeta.description;
    }

    // Handle displayName
    let displayName = "";
    if (typeof modMeta.displayName === "string") {
      displayName = modMeta.displayName;
    }

    // Handle version
    let version = "unknown";
    if (typeof modMeta.version === "string") {
      version = modMeta.version;
    }

    // Handle modId
    const modId =
      typeof modMeta.modId === "string"
        ? modMeta.modId
        : fileName.replace(".jar", "");

    // Handle homepage/displayURL
    let homepage = "";
    if (typeof modMeta.displayURL === "string") {
      homepage = modMeta.displayURL;
    }

    // Handle loaderVersion
    let modLoaderVersion = "";
    if (typeof modMeta.loaderVersion === "string") {
      modLoaderVersion = modMeta.loaderVersion;
    }

    // Handle minecraftVersion
    let minecraftVersion = "";
    if (typeof modMeta.minecraftVersion === "string") {
      minecraftVersion = modMeta.minecraftVersion;
    }

    // Handle dependencies
    const dependencies = modMeta.dependencies;

    // Side
    const side = determineSide(modMeta as Record<string, string>);

    return {
      modId,
      name: displayName || modId,
      displayName,
      version,
      author,
      description,
      homepage,
      fileName,
      fileSize: jarBuffer.length,
      checksum: generateChecksum(jarBuffer),
      modLoader,
      modLoaderVersion,
      minecraftVersion,
      side,
      dependencies,
      logoPath,
    };
  } catch (error) {
    console.error(`Error parsing mod ${fileName}:`, error);
    return null;
  }
}

// Determine mod side (CLIENT, SERVER, BOTH)
function determineSide(
  metadata: Record<string, string>,
): "CLIENT" | "SERVER" | "BOTH" {
  const side = metadata.side?.toLowerCase();
  if (side === "client") return "CLIENT";
  if (side === "server") return "SERVER";
  return "BOTH"; // Default assumption
}

// Extract and analyze mods from ZIP
async function extractAndAnalyzeMods(zipBuffer: Buffer): Promise<{
  mods: ModMetadata[];
  errors: string[];
}> {
  const mods: ModMetadata[] = [];
  const errors: string[] = [];

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      // Look for .jar files in mods/ directory
      if (
        entry.entryName.includes("mods/") &&
        entry.entryName.endsWith(".jar") &&
        !entry.isDirectory
      ) {
        try {
          const jarBuffer = entry.getData();
          const fileName = path.basename(entry.entryName);

          const metadata = await extractNeoForgeMetadata(jarBuffer, fileName);
          if (metadata) {
            mods.push(metadata);
          } else {
            errors.push(`Could not parse metadata for ${fileName}`);
          }
        } catch (error) {
          errors.push(`Failed to process ${entry.entryName}: ${String(error)}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to extract ZIP file: ${String(error)}`);
  }

  return { mods, errors };
}

// Main upload function
export async function uploadModpack(formData: FormData): Promise<UploadResult> {
  try {
    // Check authentication and admin permissions
    await requireAdmin();

    // Extract and validate form data
    const file = formData.get("file") as File;
    const rawData = {
      name: formData.get("name") as string,
      version: formData.get("version") as string,
      description: (formData.get("description") as string) ?? undefined,
      releaseNotes: (formData.get("releaseNotes") as string) ?? undefined,
      minecraftVersion: formData.get("minecraftVersion") as string,
      modLoader: formData.get("modLoader") as ModLoader,
      modLoaderVersion:
        (formData.get("modLoaderVersion") as string) ?? undefined,
      isPublic: formData.get("isPublic") === "true",
    };

    // Validate input data
    const validationResult = ModpackUploadSchema.safeParse({
      ...rawData,
      file, // Include file for validation
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: "Invalid input data",
        details: {
          errors: validationResult.error.errors.map(
            (e) => `${e.path.join(".")}: ${e.message}`,
          ),
        },
      };
    }

    const data = validationResult.data;

    // Check if modpack version already exists
    const existingModpack = await db.modpack.findFirst({
      where: {
        name: data.name,
        version: data.version,
      },
    });

    if (existingModpack) {
      return {
        success: false,
        error: `Modpack "${data.name}" version "${data.version}" already exists`,
      };
    }

    // Ensure directories exist
    await ensureDirectories();

    // Read file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileChecksum = generateChecksum(fileBuffer);

    // Create file paths
    const modpackDir = path.join(
      VERSIONS_DIR,
      data.name.replace(/[^a-zA-Z0-9-_]/g, "-"),
    );
    const versionDir = path.join(modpackDir, data.version);
    const filePath = path.join(versionDir, `${data.name}-${data.version}.zip`);

    // Create version directory
    await fs.mkdir(versionDir, { recursive: true });

    // Save the modpack file
    await fs.writeFile(filePath, fileBuffer);

    // Extract and analyze mods
    const { mods, errors } = await extractAndAnalyzeMods(fileBuffer);

    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("User session not found");
    }

    // Create modpack in database
    const modpack = await db.modpack.create({
      data: {
        name: data.name,
        description: data.description,
        version: data.version,
        minecraftVersion: data.minecraftVersion,
        modLoader: data.modLoader,
        modLoaderVersion: data.modLoaderVersion,
        releaseNotes: data.releaseNotes,
        isPublic: data.isPublic,
        filePath: path.relative(process.cwd(), filePath),
        fileSize: fileBuffer.length,
        checksum: fileChecksum,
        createdById: session.user.id,
        mods: {
          create: mods.map((mod) => ({
            modId: mod.modId,
            name: mod.name,
            displayName: mod.displayName,
            version: mod.version,
            author: mod.author,
            description: mod.description,
            homepage: mod.homepage,
            logoPath: mod.logoPath,
            fileName: mod.fileName,
            fileSize: mod.fileSize,
            checksum: mod.checksum,
            modLoader: mod.modLoader,
            modLoaderVersion: mod.modLoaderVersion,
            minecraftVersion: mod.minecraftVersion,
            side: mod.side,
            dependencies:
              (typeof mod.dependencies === "object" ||
                typeof mod.dependencies === "string") &&
              mod.dependencies !== null
                ? mod.dependencies
                : undefined,
          })),
        },
      },
    });

    return {
      success: true,
      data: {
        modpackId: modpack.id,
        modsFound: mods.length,
      },
    };
  } catch (error) {
    console.error("Upload error:", error);

    // Check if it's an admin permission error
    if (error instanceof Error && error.message.includes("admin")) {
      return {
        success: false,
        error: "Admin privileges required to upload modpacks",
      };
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload modpack",
    };
  }
}
