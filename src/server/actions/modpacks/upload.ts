"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { requireAdmin } from "~/lib/utils/admin-utils";
import {
  ModpackVersionUploadSchema,
  type ModLoader,
} from "~/lib/validations/modpack";
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

// TOML parsing types
interface ParsedTomlMod {
  modId?: string;
  displayName?: string;
  version?: string;
  authors?: string | string[];
  author?: string;
  description?: string | string[];
  displayURL?: string;
  loaderVersion?: string;
  minecraftVersion?: string;
  side?: string;
  dependencies?: unknown;
}

interface ParsedToml {
  mods?: ParsedTomlMod[] | ParsedTomlMod;
  [key: string]: unknown;
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
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_LOGOS_DIR, { recursive: true });
}

// Generate file checksum
function generateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Type guard for parsed TOML content
function isParsedToml(value: unknown): value is ParsedToml {
  return typeof value === "object" && value !== null;
}

// Type guard for mod metadata
function isParsedTomlMod(value: unknown): value is ParsedTomlMod {
  return typeof value === "object" && value !== null;
}

// Safe array access helper
function getFirstMod(mods: unknown): ParsedTomlMod | null {
  if (Array.isArray(mods) && mods.length > 0) {
    const firstMod: unknown = mods[0];
    return isParsedTomlMod(firstMod) ? firstMod : null;
  }
  return isParsedTomlMod(mods) ? mods : null;
}

// Extract and process logo from JAR
async function extractModLogo(
  zip: AdmZip,
  modId: string,
  fileName: string,
): Promise<string | undefined> {
  try {
    const logoEntry = zip.getEntry("logo.png") ?? zip.getEntry("icon.png");
    if (!logoEntry) return undefined;

    const logoFileName = `${modId || fileName.replace(".jar", "")}.png`;
    const fullLogoPath = path.join(PUBLIC_LOGOS_DIR, logoFileName);

    await fs.writeFile(fullLogoPath, logoEntry.getData());

    const webPath = `/modpacks/logos/${logoFileName}`;
    console.log(`[MOD UPLOAD] Extracted logo for ${fileName} -> ${webPath}`);

    return webPath;
  } catch (error) {
    console.warn(`Failed to extract logo for ${fileName}:`, error);
    return undefined;
  }
}

// Process author information
function processAuthor(authors: unknown, author: unknown): string {
  if (Array.isArray(authors)) {
    return authors
      .filter((a: unknown): a is string => typeof a === "string")
      .join(", ");
  }
  if (typeof authors === "string") {
    return authors;
  }
  if (typeof author === "string") {
    return author;
  }
  return "";
}

// Process description
function processDescription(description: unknown): string {
  if (Array.isArray(description)) {
    return description
      .filter((d: unknown): d is string => typeof d === "string")
      .join("\n");
  }
  if (typeof description === "string") {
    return description;
  }
  return "";
}

// Determine mod side (CLIENT, SERVER, BOTH)
function determineSide(side?: string): "CLIENT" | "SERVER" | "BOTH" {
  if (!side) return "BOTH";

  const normalizedSide = side.toLowerCase();
  if (normalizedSide === "client") return "CLIENT";
  if (normalizedSide === "server") return "SERVER";
  return "BOTH";
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

    if (!isParsedToml(parsedUnknown)) {
      console.warn(`Invalid TOML structure in ${fileName}`);
      return null;
    }

    const modMeta = getFirstMod(parsedUnknown.mods);
    if (!modMeta) {
      console.warn(`No mod metadata found in ${fileName}`);
      return null;
    }

    // Extract basic mod information with safe type checking
    const modId =
      typeof modMeta.modId === "string"
        ? modMeta.modId
        : fileName.replace(".jar", "");

    const displayName =
      typeof modMeta.displayName === "string" ? modMeta.displayName : "";

    const version =
      typeof modMeta.version === "string" ? modMeta.version : "unknown";

    const homepage =
      typeof modMeta.displayURL === "string" ? modMeta.displayURL : "";

    const modLoaderVersion =
      typeof modMeta.loaderVersion === "string" ? modMeta.loaderVersion : "";

    const minecraftVersion =
      typeof modMeta.minecraftVersion === "string"
        ? modMeta.minecraftVersion
        : "";

    // Process complex fields
    const author = processAuthor(modMeta.authors, modMeta.author);
    const description = processDescription(modMeta.description);
    const side = determineSide(
      typeof modMeta.side === "string" ? modMeta.side : undefined,
    );

    // Extract logo if present
    const logoPath = await extractModLogo(zip, modId, fileName);

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
      dependencies: modMeta.dependencies,
      logoPath,
    };
  } catch (error) {
    console.error(`Error parsing mod ${fileName}:`, error);
    return null;
  }
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

    const jarEntries = entries.filter(
      (entry) =>
        entry.entryName.includes("mods/") &&
        entry.entryName.endsWith(".jar") &&
        !entry.isDirectory,
    );

    console.log(
      `[MODPACK UPLOAD] Found ${jarEntries.length} mod files to process`,
    );

    for (const entry of jarEntries) {
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
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process ${entry.entryName}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to extract ZIP file: ${errorMessage}`);
  }

  return { mods, errors };
}

// Validate existing modpack for version addition
async function validateExistingModpack(existingModpackName: string) {
  const existingModpack = await db.modpack.findFirst({
    where: { name: existingModpackName },
  });

  if (!existingModpack) {
    throw new Error(`Modpack "${existingModpackName}" not found`);
  }

  return existingModpack;
}

// Check for duplicate version
async function checkDuplicateVersion(name: string, version: string) {
  const existingModpack = await db.modpack.findFirst({
    where: { name, version },
  });

  if (existingModpack) {
    throw new Error(`Modpack "${name}" version "${version}" already exists`);
  }
}

// Create file storage paths and save file
async function saveModpackFile(
  name: string,
  version: string,
  fileBuffer: Buffer,
): Promise<{ filePath: string; fileChecksum: string }> {
  const fileChecksum = generateChecksum(fileBuffer);

  const modpackDir = path.join(
    VERSIONS_DIR,
    name.replace(/[^a-zA-Z0-9-_]/g, "-"),
  );
  const versionDir = path.join(modpackDir, version);
  const filePath = path.join(versionDir, `${name}-${version}.zip`);

  await fs.mkdir(versionDir, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);

  return {
    filePath: path.relative(process.cwd(), filePath),
    fileChecksum,
  };
}

// Main upload function - updated to support version management
export async function uploadModpack(formData: FormData): Promise<UploadResult> {
  try {
    // Check authentication and admin permissions
    await requireAdmin();

    // Extract and validate form data
    const file = formData.get("file") as File;
    const rawData = {
      existingModpackName:
        (formData.get("existingModpackName") as string) ?? undefined,
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

    // Validate input data using the schema
    const validationResult = ModpackVersionUploadSchema.safeParse({
      ...rawData,
      file,
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

    // Handle adding version to existing modpack
    let finalData = data;
    if (data.existingModpackName) {
      const existingModpack = await validateExistingModpack(
        data.existingModpackName,
      );

      // Create new data object with inherited properties
      finalData = {
        ...data,
        name: data.existingModpackName,
        // Inherit technical settings from latest version if defaults are being used
        minecraftVersion:
          data.minecraftVersion === "1.21"
            ? existingModpack.minecraftVersion
            : data.minecraftVersion,
        modLoader:
          data.modLoader === "NEOFORGE"
            ? existingModpack.modLoader
            : data.modLoader,
      };
    }

    // Check if this specific modpack version already exists
    await checkDuplicateVersion(finalData.name, finalData.version);

    // Ensure directories exist
    await ensureDirectories();

    // Read file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Extract and analyze mods
    const { mods, errors } = await extractAndAnalyzeMods(fileBuffer);

    if (mods.length === 0) {
      return {
        success: false,
        error: "No valid mods found in modpack",
        details: { errors },
      };
    }

    // Save the modpack file
    const { filePath, fileChecksum } = await saveModpackFile(
      finalData.name,
      finalData.version,
      fileBuffer,
    );

    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("User session not found");
    }

    // Create modpack in database
    const modpack = await db.modpack.create({
      data: {
        name: finalData.name,
        description: finalData.description,
        version: finalData.version,
        minecraftVersion: finalData.minecraftVersion,
        modLoader: finalData.modLoader,
        modLoaderVersion: finalData.modLoaderVersion,
        releaseNotes: finalData.releaseNotes,
        isPublic: finalData.isPublic,
        filePath,
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

    console.log(
      `[MODPACK UPLOAD] Successfully created modpack ${finalData.name} v${finalData.version} with ${mods.length} mods`,
    );

    // Generate and store changelog for this version
    try {
      const { generateChangelog } = await import("./changelog");
      const changelogResult = await generateChangelog(modpack.id);
      if (changelogResult.success && changelogResult.data) {
        // Store the changelog in the database
        const { changes } = changelogResult.data;
        if (changes.length > 0) {
          await db.modpackChangelog.createMany({
            data: changes.map((change) => ({
              modpackId: modpack.id,
              changeType: change.changeType,
              modId: change.modId,
              modName: change.modName,
              oldVersion: change.oldVersion,
              newVersion: change.newVersion,
              description: change.description,
              impact: change.impact,
            })),
          });
          console.log(
            `[MODPACK UPLOAD] Generated changelog with ${changes.length} entries`,
          );
        }
      }
    } catch (changelogError) {
      const errorMessage =
        changelogError instanceof Error
          ? changelogError.message
          : String(changelogError);
      console.warn(
        `[MODPACK UPLOAD] Failed to generate changelog: ${errorMessage}`,
      );
      // Don't fail the upload if changelog generation fails
    }

    // Success! Return the created modpack
    return {
      success: true,
      data: {
        modpackId: modpack.id,
        modsFound: mods.length,
      },
      details: errors.length > 0 ? { errors } : undefined,
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
